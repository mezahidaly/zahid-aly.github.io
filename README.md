# Tuni

Tuni is a browser-based peer-to-peer application for sending and receiving data between devices.

## Features

- Device-to-device transfer using WebRTC data channels
- Manual signaling flow (copy/paste offer + answer payloads)
- Works with plain text or JSON payloads
- No backend required for local demo usage

## Run locally

Because browsers restrict some WebRTC behaviors on `file://`, run Tuni with a local server:

```bash
python -m http.server 8080
```

Then open:

- `http://localhost:8080` on device 1
- `http://localhost:8080` on device 2

## How to connect two devices

1. On device 1, click **Create session (Host)**.
2. Copy device 1's signaling payload and paste it into device 2's **Paste remote signaling payload** box.
3. On device 2, click **Join session (Guest)** first (if not already), then click **Apply remote payload**.
4. Copy device 2's generated payload and paste it back on device 1.
5. On device 1, click **Apply remote payload**.
6. Once connected, send data from either side.

## Notes

- This project uses a public STUN server (`stun.l.google.com:19302`) for NAT traversal.
- For production use, replace manual copy/paste signaling with a signaling service.
