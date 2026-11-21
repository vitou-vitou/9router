$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$parent = 'ff25c738156cd4d4e42b9c9de3ace8b3fbd0820c'
$tree = (& git write-tree | Out-String).Trim()
if ($tree -notmatch '^[0-9a-f]{40}$') { throw "bad tree: $tree" }
$sha = (& git commit-tree $tree -p $parent -F (Join-Path $PSScriptRoot 'squash-msg.txt') | Out-String).Trim()
if ($sha -notmatch '^[0-9a-f]{40}$') { throw "bad sha: $sha" }
& git reset --hard $sha | Out-Null
& git log -1 --format=%B
