HIIT Treadmill Lap Calculator

This is a simple static web app that calculates total distance and time for interval laps.

Structure:

How to run:
Open `index.html` in a browser (double-click or use a local web server).

Local network access:
- When you run the simple server (e.g. `python -m http.server 5500`), the app attempts to discover local IP addresses and will display them in the Overview as clickable HTTP URLs (best-effort). This uses WebRTC ICE and may be blocked in some browsers or network setups.

PowerShell helper (Windows):
You can use the included `start-server.ps1` helper which prints local IPv4 addresses and starts the Python HTTP server. From PowerShell in the `Code` folder run:

```powershell
# start server on default port 5500
pwsh ./start-server.ps1

# or specify a port
pwsh ./start-server.ps1 -Port 8000
```

The script will print URLs like `http://192.168.1.42:5500/` which you can open from other devices on the same network.

Features:
 - Base lap defined as 2 min + 2 min + six 1-min intervals (8 periods, total 10 min) by default.
 - Default speeds: 9.5, 9.8, 10, 10.5, 11, 11.5, 12, 12.5 km/h.

Notes:
This is a minimal static app—no build step required.
