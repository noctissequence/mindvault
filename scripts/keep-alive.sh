#!/bin/bash
# MindVault keep-alive — independent of any agent. Cron: /etc/cron.d/mindvault (*/2)
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
MV="$(cd "$(dirname "$0")/.." && pwd)"
cd "$MV" || exit 1

worker_alive() {
  for d in /proc/[0-9]*/cmdline; do
    [ -r "$d" ] || continue
    if tr '\0' ' ' < "$d" 2>/dev/null | grep -q "scripts/worker.ts"; then
      return 0
    fi
  done
  return 1
}

# web server: health-check based (HTTP, not process name)
if ! curl -s -o /dev/null -m 5 http://127.0.0.1:8791/api/settings; then
  for pid in $(pgrep -f "next-server" 2>/dev/null); do kill "$pid" 2>/dev/null; done
  sleep 1
  npm run start >> logs/web.log 2>&1 &
  echo "$(date -Is) web restarted" >> logs/keepalive.log
fi

# worker: /proc cmdline scan (immune to self-match)
if ! worker_alive; then
  node --import "$MV/node_modules/tsx/dist/loader.mjs" scripts/worker.ts >> logs/worker.log 2>&1 &
  echo "$(date -Is) worker restarted" >> logs/keepalive.log
fi
