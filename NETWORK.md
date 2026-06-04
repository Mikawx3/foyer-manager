# Local Network Access

## Quick access (no DNS)

1. Find your Mac IP: **System Settings → Wi-Fi → Details**  
   Or run: `ipconfig getifaddr en0`
2. Start the app: `npm run dev`
3. The dev servers bind to all interfaces (`0.0.0.0`) — see `apps/web/vite.config.ts` and `apps/api/src/main.ts`.
4. Access from any device on the network: `http://192.168.x.x:5173`

Replace `192.168.x.x` with your actual Mac IP.

## Custom local domain (optional)

Add to `/etc/hosts` on each device:

```
192.168.x.x   foyer.local
```

Then access via `http://foyer.local:5173`

## Notes

- The API (port 3000) must also be reachable on the host machine. It listens on `0.0.0.0` in dev.
- The Vite dev server proxies `/api` to `http://localhost:3000`. Use the web URL (`:5173`) from other devices; the proxy runs on your Mac.
- Replace `192.168.x.x` with your actual Mac IP.
