$ErrorActionPreference = 'SilentlyContinue'

$pids = @(Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique)

if (-not $pids -or $pids.Count -eq 0) {
  Write-Output 'no_listeners'
  exit 0
}

foreach ($id in $pids) {
  try {
    Stop-Process -Id $id -Force -ErrorAction Stop
    Write-Output "killed $id"
  } catch {
    Write-Output ("failed {0}: {1}" -f $id, $_.Exception.Message)
  }
}
