# Start-server PowerShell helper
# Prints local IPv4 addresses and starts a Python simple HTTP server
# Usage: pwsh ./start-server.ps1

param(
  [int]$Port = 5500
)

# Change to script directory
if ($PSScriptRoot) { Set-Location $PSScriptRoot }

# Discover local IPv4 addresses
$ips = @()
try {
  $hostEntry = [System.Net.Dns]::GetHostEntry([System.Net.Dns]::GetHostName())
  if ($hostEntry -and $hostEntry.AddressList) {
    $ips = $hostEntry.AddressList | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.ToString() -ne '127.0.0.1' } | ForEach-Object { $_.ToString() }
  }
} catch {
  # fallback: try WMI
  try {
    $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress
  } catch { }
}

Write-Host "Serving files from: $(Get-Location)" -ForegroundColor Cyan
if ($ips -and $ips.Count -gt 0) {
  Write-Host "Local addresses:" -ForegroundColor Green
  foreach ($ip in $ips) {
    Write-Host "  http://$ip:$Port/"
  }
} else {
  Write-Host "No non-loopback IPv4 addresses detected. You can still use http://127.0.0.1:$Port/" -ForegroundColor Yellow
}

# Find python
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $py) {
  Write-Error "Python executable not found in PATH. Install Python or start a static server manually (e.g. 'python -m http.server $Port')."
  exit 1
}

Write-Host "Starting python -m http.server $Port ... (press Ctrl+C to stop)" -ForegroundColor Cyan
# Start server in foreground so user can stop with Ctrl+C
& $py.Name -ArgumentList "-m","http.server",$Port
