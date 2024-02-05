# Set baseDir to the current directory
$baseDir = Get-Location

# Check for existence of required files and folders
$requiredFiles = @(
    "LICENSE"
    "manifest.v2.json",
    "manifest.v3.chrome.json",
    "manifest.v3.firefox.json",
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

# Clean output directory if it already exists
$outputDir = Join-Path $baseDir "output"
if (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Recurse -Force
} 
New-Item -Path $outputDir -ItemType Directory | Out-Null

# Read and parse manifest.v3.json
$manifestPath = Join-Path $baseDir "manifest.v3.chrome.json"
$manifestContent = Get-Content $manifestPath -Raw | ConvertFrom-Json

$version = $manifestContent.version

# Create packages for manifest v2 and v3
foreach ($manifest in @("manifest.v2.json", "manifest.v3.chrome.json", "manifest.v3.firefox.json")) {
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