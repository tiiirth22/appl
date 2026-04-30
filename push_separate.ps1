# ApplianceIQ Git Automation Script
# Commits and Pushes every modified file separately

$files = git status --porcelain | ForEach-Object { $_.Substring(3) }

if ($files.Count -eq 0) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit
}

Write-Host "Found $($files.Count) modified files. Starting atomic push..." -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "Processing: $file" -ForegroundColor Gray
    git add $file
    git commit -m "UI Overhaul: Updating $file to Solid v3.1 Theme"
    Write-Host "Pushing $file..." -ForegroundColor Gray
    git push
}

Write-Host "All files committed and pushed separately. Version history is clean!" -ForegroundColor Green
