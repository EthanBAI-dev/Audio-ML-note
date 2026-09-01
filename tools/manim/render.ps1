# 渲染课程动画。
#
#   .\render.ps1 Aliasing              # 480p15，改稿时用
#   .\render.ps1 Aliasing -q h         # 1080p60，交付用
#   .\render.ps1 Aliasing -q h -gif    # 同时导一份 GIF，给 Markdown 里内嵌
#
# ffmpeg 是 winget 装的，PATH 写进了注册表但当前进程读不到，所以这里显式前置。

param(
  [Parameter(Mandatory = $true)][string]$Scene,
  [ValidateSet('l', 'm', 'h', 'k')][string]$q = 'l',
  [switch]$gif
)

$ff = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin"
if (Test-Path $ff) { $env:Path = "$ff;$env:Path" }

Set-Location $PSScriptRoot

$cli = @("-q$q", '--disable_caching', 'scenes.py', $Scene)
if ($gif) { $cli += '--format=gif' }

manim @cli
