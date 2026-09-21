param(
  [string]$Root = ".",
  [string]$Output = "ci-evidence/regulatory-observation"
)

$ErrorActionPreference = "Stop"
$config = Get-Content -Raw -LiteralPath (Join-Path $Root "config/regulatory/source-observation.json") | ConvertFrom-Json
$payloads = Join-Path $Output "payloads"
New-Item -ItemType Directory -Force -Path $payloads | Out-Null
$results = @()

foreach ($target in $config.targets) {
  $destination = Join-Path $payloads $target.file
  $temporary = "$destination.partial"
  Remove-Item -Force -ErrorAction SilentlyContinue $destination, $temporary
  $status = "failed"
  $errorText = ""
  $size = 0
  $digest = ""
  try {
    Invoke-WebRequest -Uri $target.url -OutFile $temporary -MaximumRedirection 0 -TimeoutSec $config.policy.timeoutSeconds
    $size = (Get-Item -LiteralPath $temporary).Length
    if ($size -le 0 -or $size -gt $config.policy.maximumBytes) {
      throw "SIZE_BOUND: $size"
    }
    Move-Item -LiteralPath $temporary -Destination $destination
    $digest = (Get-FileHash -Algorithm SHA256 -LiteralPath $destination).Hash.ToLowerInvariant()
    $status = "captured"
  } catch {
    $errorText = $_.Exception.Message
    if ($errorText.Length -gt 500) { $errorText = $errorText.Substring(0, 500) }
    Remove-Item -Force -ErrorAction SilentlyContinue $temporary
  }
  $results += [ordered]@{
    id = $target.id
    source = $target.source
    url = $target.url
    file = $target.file
    status = $status
    bytes = $size
    sha256 = $digest
    error = $errorText
  }
}

$manifest = [ordered]@{
  schemaVersion = 1
  observer = "REGULATORY-SOURCE-OBSERVER-0001"
  observedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platform = "Windows-$([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"
  tls = "platform-default verification; no bypass or weakened policy"
  results = $results
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8NoBOM -LiteralPath (Join-Path $Output "manifest.json")
