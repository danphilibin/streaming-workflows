#!/usr/bin/env bash
#
# Validates that @relay-tools/sdk works when installed from a tarball,
# the way an npm consumer would experience it. Run from the repo root:
#
#   bash scripts/validate-pack.sh
#
set -euo pipefail

SDK_DIR="packages/sdk"
TMPDIR_PREFIX="relay-validate"

# ── Pack ─────────────────────────────────────────────────────────
echo "==> Building SDK..."
pnpm --filter @relay-tools/sdk build

echo "==> Packing SDK..."
TARBALL=$(cd "$SDK_DIR" && pnpm pack 2>/dev/null | tail -1)
TARBALL_PATH="$(pwd)/$SDK_DIR/$TARBALL"

if [ ! -f "$TARBALL_PATH" ]; then
  echo "ERROR: pack produced no tarball at $TARBALL_PATH"
  exit 1
fi

echo "    Tarball: $TARBALL_PATH"

# ── Scratch project ──────────────────────────────────────────────
SCRATCH=$(mktemp -d -t "$TMPDIR_PREFIX.XXXXXX")
echo "==> Scratch project: $SCRATCH"

cleanup() {
  rm -rf "$SCRATCH"
  rm -f "$TARBALL_PATH"
  echo "==> Cleaned up."
}
trap cleanup EXIT

cd "$SCRATCH"

# Minimal package.json — install the tarball + deps needed for types to resolve
cat > package.json <<'EOF'
{
  "name": "validate-relay-sdk",
  "private": true,
  "type": "module"
}
EOF

echo "==> Installing tarball..."
npm install --save "$TARBALL_PATH" 2>&1 | tail -3

# Install peer deps that the type checker needs to resolve SDK type references.
# These aren't listed as peerDependencies (they're regular deps), but the .d.ts
# files reference their types so tsc needs them present.
npm install --save zod @modelcontextprotocol/sdk @tsndr/cloudflare-worker-jwt 2>&1 | tail -3
npm install --save-dev typescript 2>&1 | tail -3

# ── TypeScript check ─────────────────────────────────────────────
# Use node16 moduleResolution — this is the stricter setting that catches
# missing exports, wrong extension mappings, etc.
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["check.ts"]
}
EOF

cat > check.ts <<'EOF'
// Verify main entry point — types only (requires cloudflare:workers at runtime)
import type { RelayExecutor } from "@relay-tools/sdk";
import { createWorkflow, httpHandler, field } from "@relay-tools/sdk";

// Verify client entry point — should work at runtime too
import { parseStreamMessage, StreamMessageSchema } from "@relay-tools/sdk/client";
import type { StreamMessage, WorkflowStatus, InputSchema } from "@relay-tools/sdk/client";

// Verify mcp entry point — types only (requires stdio at runtime)
import type { CreateRelayMcpServerOptions } from "@relay-tools/sdk/mcp";
import { createRelayMcpServer } from "@relay-tools/sdk/mcp";

// Smoke-test: ensure the client export actually has runtime values
console.log("StreamMessageSchema:", typeof StreamMessageSchema);
console.log("parseStreamMessage:", typeof parseStreamMessage);
console.log("createWorkflow:", typeof createWorkflow);

console.log("All imports resolved successfully.");
EOF

echo "==> Type-checking with node16 moduleResolution..."
npx tsc --noEmit

echo "==> Running client import at runtime..."
node -e "
  import('@relay-tools/sdk/client').then(m => {
    if (typeof m.parseStreamMessage !== 'function') {
      console.error('FAIL: parseStreamMessage is not a function');
      process.exit(1);
    }
    if (typeof m.StreamMessageSchema !== 'object') {
      console.error('FAIL: StreamMessageSchema is not an object');
      process.exit(1);
    }
    console.log('Client runtime imports OK.');
  }).catch(e => {
    console.error('FAIL:', e.message);
    process.exit(1);
  });
"

echo ""
echo "==> All checks passed."
