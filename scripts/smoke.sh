#!/bin/sh
# Smoke test of the production build (step of `just gate`, pre-merge gate step 5): `vite preview`
# serves dist/ as Cloudflare Workers will, and the page must answer 200 with the app title and a
# fetchable JavaScript bundle. The browser-level QA pass runs on staging (skill qa-browser-check);
# the Playwright suite is #46. Usage: smoke.sh [port]
set -eu
port=${1:-4173}
[ -f dist/index.html ] || { echo "smoke: dist/index.html missing, run pnpm build first" >&2; exit 1; }
# Bound to 127.0.0.1 explicitly: the default `localhost` may resolve to ::1 only. The binary is
# started directly (not through `pnpm exec`) so the pid the trap kills is the server itself.
node_modules/.bin/vite preview --strictPort --host 127.0.0.1 --port "$port" > /dev/null 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
url="http://127.0.0.1:$port"
i=0
until curl -sf -o /dev/null "$url/"; do
  kill -0 "$pid" 2>/dev/null || { echo "smoke: vite preview exited (port $port busy?)" >&2; exit 1; }
  i=$((i + 1)); [ "$i" -lt 50 ] || { echo "smoke: $url did not answer within 5 s" >&2; exit 1; }
  sleep 0.1
done
page=$(curl -sf "$url/")
printf '%s' "$page" | grep -q '<title>brickpix' || { echo "smoke: the page has no brickpix title" >&2; exit 1; }
js=$(printf '%s' "$page" | sed -n 's/.*<script[^>]*src="\([^"]*\.js\)".*/\1/p' | head -n 1)
[ -n "$js" ] || { echo "smoke: the page references no JavaScript bundle" >&2; exit 1; }
case "$js" in /*) ;; *) js="/${js#./}" ;; esac # a relative base in vite.config.ts
curl -sf -o /dev/null "$url$js" || { echo "smoke: bundle $js is not served" >&2; exit 1; }
echo "smoke: $url serves the production build ($js)"
