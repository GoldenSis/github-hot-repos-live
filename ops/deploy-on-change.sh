#!/bin/zsh
# Deploy the archive Worker when the remote has new commits (e.g. the weekly routine
# pushed a fresh issue). Uses the Mac's existing `wrangler login`. Idempotent + cheap:
# it only builds/deploys when origin/master actually moved. Log: ops/deploy.log.
#
# Interim deploy path until the fully-cloud GitHub Action (Option A) is wired.
set -e
REPO="$HOME/projects/github-hot-repos-live"
LOG="$REPO/ops/deploy.log"
ts() { date '+%Y-%m-%d %H:%M:%S'; }
cd "$REPO" || exit 0

git fetch -q origin master 2>>"$LOG" || { echo "$(ts) fetch failed" >>"$LOG"; exit 0; }
local_sha=$(git rev-parse HEAD)
remote_sha=$(git rev-parse origin/master)
if [ "$local_sha" = "$remote_sha" ]; then
  echo "$(ts) up-to-date ($local_sha)" >>"$LOG"
  exit 0
fi

echo "$(ts) new commits $local_sha -> $remote_sha, deploying" >>"$LOG"
git merge --ff-only origin/master >>"$LOG" 2>&1 || { echo "$(ts) not fast-forward — skipping" >>"$LOG"; exit 0; }
node scripts/build-index.mjs >>"$LOG" 2>&1
if npx wrangler deploy >>"$LOG" 2>&1; then
  echo "$(ts) DEPLOYED $(git rev-parse HEAD)" >>"$LOG"
else
  echo "$(ts) DEPLOY FAILED" >>"$LOG"
fi
