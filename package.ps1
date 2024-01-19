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

# Clean output directory if it already exists
$outputDir = Join-Path $baseDir "output"
if (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Recurse -Force
} 
New-Item -Path $outputDir -ItemType Directory | Out-Null

$scriptsDir = Join-Path $baseDir "scripts"

# Bundle scripts for userscript
$userScriptContent = Get-Content (Join-Path $scriptsDir "query.js")
$userScriptContent += Get-Content (Join-Path $scriptsDir "utils.js")
$userScriptContent += Get-Content (Join-Path $scriptsDir "dom.js")
$userScriptContent += Get-Content (Join-Path $scriptsDir "main.js")
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
    $version = $manifestContent.version

    $outputPath = Join-Path $outputDir "HNRelevant-$($manifest.Replace('.json', ''))-v$version.zip"
    
    # Copy the manifest to a temporary file named "manifest.json"
    $tempManifestPath = Join-Path $baseDir "manifest.json"
    Copy-Item -Path (Join-Path $baseDir $manifest) -Destination $tempManifestPath

    # Add the temporary manifest to files to package
    $filesToPackage += "manifest.json"
    
    # Join paths for each file individually
    $pathsToPackage = $filesToPackage | ForEach-Object { Join-Path $baseDir $_ }
    
    Compress-Archive -Path $pathsToPackage -DestinationPath $outputPath -CompressionLevel Optimal -Force

    # Delete the temporary manifest
    Remove-Item -Path $tempManifestPath -Force

    Write-Host "Created " $outputPath
}