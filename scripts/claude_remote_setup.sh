#!/bin/bash

# Only run in remote environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

pnpm i
pnpm cf-typegen

npm install -g agent-browser
agent-browser install

exit 0