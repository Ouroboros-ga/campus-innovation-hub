[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$ServerUser,

  [Parameter(Mandatory)]
  [ValidatePattern('^[A-Za-z0-9.:-]+$')]
  [string]$ServerHost,

  [ValidateRange(1024, 65535)]
  [int]$LocalPort = 18000
)

$ssh = Get-Command ssh.exe -ErrorAction Stop
$target = "$ServerUser@$ServerHost"
$arguments = @(
  '-NT',
  '-o', 'BatchMode=yes',
  '-o', 'ExitOnForwardFailure=yes',
  '-o', 'ServerAliveInterval=30',
  '-o', 'ServerAliveCountMax=3',
  '-L', "127.0.0.1:$LocalPort`:127.0.0.1:8000",
  $target
)

& $ssh.Source @arguments
exit $LASTEXITCODE
