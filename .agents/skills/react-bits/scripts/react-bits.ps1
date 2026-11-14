<#
.SYNOPSIS
  Universal React Bits helper for initializing components.json, discovering components,
  and installing React Bits components into any React / Next.js / Vite project.

.EXAMPLE
  .\react-bits.ps1 -Init
  .\react-bits.ps1 -Add SplitText,Aurora
  .\react-bits.ps1 -Search "aurora"
  .\react-bits.ps1 -List
#>
[CmdletBinding()]
param(
    [string]$ProjectDir = ".",
    [switch]$Init,
    [string[]]$Add,
    [string]$Search,
    [switch]$List,
    [ValidateSet("", "TS-TW", "TS-CSS", "JS-TW", "JS-CSS")]
    [string]$Variant = "",
    [switch]$UseShadcn,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$RegistryBase = "https://reactbits.dev/r"
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

function Read-JsonFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return $null }
    $raw = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    # Strip // line comments and /* */ block comments for tsconfig/jsconfig compatibility
    $clean = [regex]::Replace($raw, '/\*[\s\S]*?\*/', '')
    $clean = [regex]::Replace($clean, '(?m)^\s*//.*$', '')
    $clean = [regex]::Replace($clean, ',(\s*[}\]])', '$1')
    try {
        return ($clean | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Get-ProjectLayout {
    param([string]$Root)

    $pkg = Read-JsonFile (Join-Path $Root "package.json")
    $hasTs = Test-Path (Join-Path $Root "tsconfig.json")
    $hasSrc = Test-Path (Join-Path $Root "src")

    # Detect Tailwind CSS
    $twConfigs = @("tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs")
    $twConfig = ""
    foreach ($cfg in $twConfigs) {
        if (Test-Path (Join-Path $Root $cfg)) { $twConfig = $cfg; break }
    }

    $hasTwPkg = $false
    $hasNextPkg = $false
    $hasLucidePkg = $false
    $installedPkgs = @{}
    if ($pkg) {
        foreach ($section in @("dependencies", "devDependencies")) {
            $obj = $pkg.$section
            if ($obj) {
                foreach ($prop in $obj.PSObject.Properties) {
                    $installedPkgs[$prop.Name] = $true
                    if ($prop.Name -eq "tailwindcss" -or $prop.Name -like "@tailwindcss/*") { $hasTwPkg = $true }
                    if ($prop.Name -eq "next") { $hasNextPkg = $true }
                    if ($prop.Name -eq "lucide-react") { $hasLucidePkg = $true }
                }
            }
        }
    }

    # Detect CSS entry
    $cssCandidates = @(
        "src/styles/globals.css", "src/app/globals.css", "app/globals.css",
        "styles/globals.css", "src/index.css", "src/App.css", "src/globals.css"
    )
    $cssFile = ""
    foreach ($c in $cssCandidates) {
        if (Test-Path (Join-Path $Root $c)) { $cssFile = $c; break }
    }
    if (-not $cssFile) {
        $cssFile = if ($hasSrc) { "src/index.css" } else { "app/globals.css" }
    }

    $hasTwImport = $false
    $cssFullPath = Join-Path $Root ($cssFile -replace '/', '\')
    if (Test-Path $cssFullPath) {
        $cssText = Get-Content -Raw $cssFullPath
        if ($cssText -match '@tailwind|@import\s+["'']tailwindcss["'']') { $hasTwImport = $true }
    }

    $isTailwind = [bool]($twConfig -or $hasTwPkg -or $hasTwImport)
    $isRsc = $hasNextPkg -and ((Test-Path (Join-Path $Root "src\app")) -or (Test-Path (Join-Path $Root "app")))

    # Detect alias prefix (@/* or ~/*) and base folder
    $aliasPrefix = "@"
    $aliasBase = if ($hasSrc) { "src" } else { "" }
    $tsCfg = Read-JsonFile (Join-Path $Root $(if ($hasTs) { "tsconfig.json" } else { "jsconfig.json" }))
    if ($tsCfg -and $tsCfg.compilerOptions -and $tsCfg.compilerOptions.paths) {
        foreach ($p in $tsCfg.compilerOptions.paths.PSObject.Properties) {
            if ($p.Name -match '^([@~])/\*$') {
                $aliasPrefix = $Matches[1]
                $targetVal = @($p.Value)[0]
                if ($targetVal -match '^\.?/?(.+?)/\*$') {
                    $aliasBase = $Matches[1].TrimEnd('/')
                } elseif ($targetVal -eq './*' -or $targetVal -eq '*') {
                    $aliasBase = ""
                }
                break
            }
        }
    }

    # Detect baseColor from package/css hints or default zinc
    $baseColor = "zinc"
    $lang = if ($hasTs) { "TS" } else { "JS" }
    $style = if ($isTailwind) { "TW" } else { "CSS" }

    return [PSCustomObject]@{
        Root          = $Root
        HasTs         = $hasTs
        HasSrc        = $hasSrc
        IsTailwind    = $isTailwind
        IsRsc         = $isRsc
        TailwindCfg   = $twConfig
        CssFile       = $cssFile
        BaseColor     = $baseColor
        IconLibrary   = if ($hasLucidePkg) { "lucide" } else { "lucide" }
        AliasPrefix   = $aliasPrefix
        AliasBase     = $aliasBase
        DefaultVariant = "$lang-$style"
        InstalledPkgs = $installedPkgs
    }
}

function Resolve-AliasPath {
    param([string]$AliasOrRel, [PSCustomObject]$Layout, [string]$ComponentsDir = "")
    $p = $AliasOrRel -replace '\\', '/'
    if ($p -match '^@components/(.+)$') {
        $sub = $Matches[1]
        if ($ComponentsDir) {
            return (Join-Path $ComponentsDir ($sub -replace '/', '\'))
        }
        $compBase = if ($Layout.AliasBase) { "$($Layout.AliasBase)/components" } else { "components" }
        return (Join-Path $Layout.Root ("$compBase/$sub" -replace '/', '\'))
    }
    if ($p -match '^[@~]/(.+)$') {
        $sub = $Matches[1]
        $rel = if ($Layout.AliasBase) { "$($Layout.AliasBase)/$sub" } else { $sub }
        return (Join-Path $Layout.Root ($rel -replace '/', '\'))
    }
    return (Join-Path $Layout.Root ($p -replace '/', '\'))
}

function Initialize-ComponentsJson {
    param([PSCustomObject]$Layout)

    $cfgPath = Join-Path $Layout.Root "components.json"
    if (Test-Path $cfgPath) {
        $existing = Get-Content -Raw $cfgPath | ConvertFrom-Json
        if (-not ($existing.PSObject.Properties.Name -contains "registries") -or $null -eq $existing.registries) {
            $existing | Add-Member -NotePropertyName "registries" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }
        $existing.registries | Add-Member -NotePropertyName "@react-bits" -NotePropertyValue "$RegistryBase/{name}.json" -Force
        $json = $existing | ConvertTo-Json -Depth 10
        Write-Utf8NoBom -Path $cfgPath -Content ($json + "`n")
        Write-Host "Updated components.json with @react-bits registry."
        return $existing
    }

    $pfx = $Layout.AliasPrefix
    $obj = [ordered]@{
        "`$schema"    = "https://ui.shadcn.com/schema.json"
        style         = "new-york"
        rsc           = $Layout.IsRsc
        tsx           = $Layout.HasTs
        tailwind      = [ordered]@{
            config       = $Layout.TailwindCfg
            css          = $Layout.CssFile
            baseColor    = $Layout.BaseColor
            cssVariables = $true
            prefix       = ""
        }
        iconLibrary   = $Layout.IconLibrary
        aliases       = [ordered]@{
            components = "$pfx/components"
            utils      = "$pfx/lib/utils"
            ui         = "$pfx/components/ui"
            lib        = "$pfx/lib"
            hooks      = "$pfx/hooks"
        }
        registries    = [ordered]@{
            "@react-bits" = "$RegistryBase/{name}.json"
        }
    }
    $json = $obj | ConvertTo-Json -Depth 10
    Write-Utf8NoBom -Path $cfgPath -Content ($json + "`n")
    Write-Host "Created components.json ($($Layout.DefaultVariant), css: $($Layout.CssFile))."
    return ($json | ConvertFrom-Json)
}

function Install-ReactBitsItem {
    param(
        [string]$ItemName,
        [PSCustomObject]$Layout,
        [object]$ComponentsCfg,
        [hashtable]$Visited,
        [System.Collections.Generic.HashSet[string]]$MissingDeps
    )

    if ($Visited.ContainsKey($ItemName)) { return }
    $Visited[$ItemName] = $true

    $url = "$RegistryBase/$ItemName.json"
    $item = Invoke-RestMethod -Uri $url -TimeoutSec 15

    if ($item.registryDependencies) {
        foreach ($depUrl in $item.registryDependencies) {
            if ($depUrl -match '/r/([^/]+)\.json$') {
                Install-ReactBitsItem -ItemName $Matches[1] -Layout $Layout -ComponentsCfg $ComponentsCfg -Visited $Visited -MissingDeps $MissingDeps
            }
        }
    }

    $componentsAlias = if ($ComponentsCfg.aliases -and $ComponentsCfg.aliases.components) {
        $ComponentsCfg.aliases.components
    } else {
        "$($Layout.AliasPrefix)/components"
    }
    $componentsDir = Resolve-AliasPath -AliasOrRel $componentsAlias -Layout $Layout

    foreach ($file in $item.files) {
        if ($file.target) {
            $destPath = Resolve-AliasPath -AliasOrRel $file.target -Layout $Layout -ComponentsDir $componentsDir
        } else {
            $relPath = $file.path -replace '^/', ''
            $destPath = Join-Path $componentsDir ($relPath -replace '/', '\')
        }

        if ((Test-Path $destPath) -and -not $Force) {
            Write-Output "Skipped existing file (use -Force to overwrite): $destPath"
            continue
        }

        $content = $file.content
        if ($Layout.AliasPrefix -ne "@" -and $content) {
            $content = $content -replace '@/lib/utils', "$($Layout.AliasPrefix)/lib/utils"
        }
        Write-Utf8NoBom -Path $destPath -Content $content
        Write-Output "Installed: $destPath"
    }

    if ($item.dependencies) {
        foreach ($dep in $item.dependencies) {
            # Strip version specifier (@^x.y.z) while keeping scoped package prefix
            $pkgName = $dep -replace '^(@?[^@]+)@.*$', '$1'
            if (-not $Layout.InstalledPkgs.ContainsKey($pkgName)) {
                [void]$MissingDeps.Add($dep)
            }
        }
    }
}

$resolvedRoot = (Resolve-Path $ProjectDir).Path
$layout = Get-ProjectLayout -Root $resolvedRoot

if ($List -or $Search) {
    $idx = Invoke-RestMethod -Uri "$RegistryBase/registry.json" -TimeoutSec 15
    $items = $idx.items | Where-Object { $_.name -like "*-TS-TW" }
    if ($Search) {
        $q = $Search.ToLowerInvariant()
        $items = $items | Where-Object {
            $_.title.ToLowerInvariant().Contains($q) -or
            ($_.description -and $_.description.ToLowerInvariant().Contains($q))
        }
    }
    foreach ($it in $items) {
        Write-Output "$($it.title) — $($it.description)"
    }
    exit 0
}

$cfg = $null
if ($Init -or $Add) {
    $cfg = Initialize-ComponentsJson -Layout $layout
}

if ($Add) {
    $names = @()
    foreach ($entry in $Add) {
        $names += ($entry -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    }

    $chosenVariant = if ($Variant) { $Variant } else { $layout.DefaultVariant }
    $langOnly = ($chosenVariant -split '-')[0]

    if ($UseShadcn) {
        if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
            throw "npx was not found on PATH. Re-run without -UseShadcn to install directly from the registry."
        }
        Push-Location $resolvedRoot
        try {
            foreach ($n in $names) {
                $full = if ($n -match '-(JS|TS)-(CSS|TW)$|-(JS|TS)$') { $n } elseif ($n -like 'Sound*') { "$n-$langOnly" } else { "$n-$chosenVariant" }
                & npx shadcn@latest add "@react-bits/$full"
            }
        } finally {
            Pop-Location
        }
        exit 0
    }

    $visited = @{}
    $missingDeps = New-Object 'System.Collections.Generic.HashSet[string]'

    foreach ($n in $names) {
        $full = if ($n -match '-(JS|TS)-(CSS|TW)$|-(JS|TS)$') {
            $n
        } elseif ($n -like 'Sound*') {
            "$n-$langOnly"
        } else {
            "$n-$chosenVariant"
        }
        Install-ReactBitsItem -ItemName $full -Layout $layout -ComponentsCfg $cfg -Visited $visited -MissingDeps $missingDeps
    }

    if ($missingDeps.Count -gt 0) {
        $depList = ($missingDeps | Sort-Object) -join " "
        Write-Output ""
        Write-Output "Missing npm dependencies detected. Install them with:"
        Write-Output "  npm install $depList"
    }
}

if (-not ($Init -or $Add -or $List -or $Search)) {
    Write-Output "Detected project: $($layout.DefaultVariant) | CSS: $($layout.CssFile) | Root: $resolvedRoot"
    Write-Output "Use -Init, -Add <Name>, -Search <query>, or -List."
}
