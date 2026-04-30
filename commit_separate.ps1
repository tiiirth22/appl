# ApplianceIQ Individual File Committer
# Automatically commits every changed/deleted/new file separately

$changes = git status --short
if (-not $changes) {
    Write-Host "No changes to commit!" -ForegroundColor Yellow
    exit
}

$count = 0
$total = ($changes | Measure-Object).Count

Write-Host "Found $total files to commit individually..." -ForegroundColor Cyan

foreach ($line in $changes) {
    $count++
    # Get the status and the filename
    $status = $line.Substring(0, 2).Trim()
    $file = $line.Substring(3).Trim()
    
    # Handle renamed files (Status R)
    if ($status -eq "R") {
        $file = ($file -split " -> ")[1]
    }

    Write-Host "[$count/$total] Committing: $file ($status)" -ForegroundColor Green
    
    # Generate a meaningful prefix based on the file path
    $prefix = "chore"
    if ($file.StartsWith("ml_service/")) { $prefix = "feat(ml_service)" }
    elseif ($file.StartsWith("backend/")) { $prefix = "feat(backend)" }
    elseif ($file.StartsWith("frontend/")) { $prefix = "feat(frontend)" }
    elseif ($file.EndsWith(".md")) { $prefix = "docs" }
    elseif ($file.EndsWith(".bat") -or $file.EndsWith(".ps1") -or $file.EndsWith(".yml")) { $prefix = "build" }
    
    $action = "update"
    if ($status -eq "A" -or $status -eq "??") { $action = "add" }
    elseif ($status -eq "D") { $action = "remove" }

    # Add and commit
    git add "$file"
    git commit -m "${prefix}: $action $file" --quiet
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "All $total files have been committed separately!" -ForegroundColor Green
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main
Write-Host "Done!" -ForegroundColor Green
