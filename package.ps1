# Set baseDir to the current directory
$baseDir = Get-Location

# Check for existence of required files and folders
$requiredFiles = @(
    "LICENSE"
    "manifest.v2.json",
    "manifest.v3.json",
    "popup.html",
    "scripts",
    "assets",
    "css",
    "icon.png"
)
$missingFiles = $requiredFiles | Where-Object { -not (Test-Path (Join-Path $baseDir $_)) }
if ($missingFiles) {
    Write-Error "The following required files are missing: $missingFiles"
    Exit
}

# Check if WinRAR is installed
# Tried using Compress-Archive but the result file wasn't compatible with Firefox
$winRarPath = "C:\Program Files\WinRAR\WinRAR.exe"  # Replace with the actual path to WinRAR.exe
if (-not (Test-Path $winRarPath)) {
    Write-Host "WinRAR is not installed. Exiting..."
    exit
}

$scriptsDir = Join-Path $baseDir "scripts"

# Clean output directory if it already exists
$outputDir = Join-Path $baseDir "output"
if (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Recurse -Force
} 
New-Item -Path $outputDir -ItemType Directory | Out-Null

# Read and parse manifest.v3.json
$manifestPath = Join-Path $baseDir "manifest.v3.json"
$manifestContent = Get-Content $manifestPath -Raw | ConvertFrom-Json

# Extract userscript metadata
$name = $manifestContent.name
$version = $manifestContent.version
$description = $manifestContent.description
$author = "imdj"
$match = $manifestContent.content_scripts[0].matches[0]
$icon = "https://raw.githubusercontent.com/imdj/HNRelevant/main/icon.png"
$runAt = "document-start"

# Bundle scripts for userscript
$userScriptContent = @"
// ==UserScript==
// @name         $name
// @version      $version
// @description  $description
// @author       $author
// @match        $match
// @icon         $icon
// @run-at       $runAt
// @grant        none
// @inject-into content
// ==/UserScript==

window.addEventListener('load', function () {
    (function () {
        'use strict';
"@

# Add comments for each file name before its content
$scriptFiles = @("query.js", "utils.js", "dom.js", "main.js")
foreach ($scriptFile in $scriptFiles) {
    $userScriptContent += "`n`n/* $scriptFile */`n"
    if ($scriptFile -eq "main.js") {
        $mainJsContent = Get-Content (Join-Path $scriptsDir $scriptFile) -Raw

        # Replace main function with updateSidebarResults directly
        $mainJsContent = $mainJsContent -replace "\(async[\s\S]*\(\);", @"
        // Make sure to run this after the page has loaded
        updateSidebarResults();
        
        // Run on dropdown change (changing num of results: 5, 10, 15, 20, 30)
        numOfResultsDropdown.addEventListener('change', () =>
           updateSidebarResults());
    
        // Run on dropdown change (changing date range: past week, past month, past year, all time)
        dateRangeDropdown.addEventListener('change', () =>
            updateSidebarResults());
    
        // Run on date range input change
        startDateInput.addEventListener('change', () =>
            updateSidebarResults());
    
        endDateInput.addEventListener('change', () =>
            updateSidebarResults());
"@

        $userScriptContent += $mainJsContent
    } else {
        $userScriptContent += Get-Content (Join-Path $scriptsDir $scriptFile) -Raw
    }
}

$userScriptContent += "`n" + @"
})();
});
"@

Set-Content -Path (Join-Path $baseDir "HNRelevant.user.js") -Value $userScriptContent

# Create packages for manifest v2 and v3
foreach ($manifest in @("manifest.v2.json", "manifest.v3.json")) {
    $filesToPackage = @(
        "LICENSE"
        "popup.html",
        "scripts",
        "assets",
        "css",
        "icon.png"
    )

    # Extract version from manifest
    $manifestContent = Get-Content (Join-Path $baseDir $manifest) -Raw | ConvertFrom-Json

    $outputPath = Join-Path $outputDir "HNRelevant-$($manifest.Replace('.json', ''))-v$version.zip"
    
    # Copy the manifest to a temporary file named "manifest.json"
    $tempManifestPath = Join-Path $baseDir "manifest.json"
    Copy-Item -Path (Join-Path $baseDir $manifest) -Destination $tempManifestPath

    # Add the temporary manifest to files to package
    $filesToPackage += "manifest.json"
    
    # Join paths for each file individually
    $pathsToPackage = $filesToPackage | ForEach-Object { Join-Path $baseDir $_ }
    
    # Use WinRAR to create the zip file
    $winRarCommand = "a -afzip -ep1 -r $outputPath $pathsToPackage"
    Start-Process -FilePath $winRarPath -ArgumentList $winRarCommand -NoNewWindow -Wait

    # Delete the temporary manifest
    Remove-Item -Path $tempManifestPath -Force

    Write-Host "Created " $outputPath
}