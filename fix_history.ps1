# ApplianceIQ History Repair Script (SILENT VERSION)
# Rewrites all commits to use the correct name and email automatically

$CORRECT_NAME = "tiirth22"
$CORRECT_EMAIL = "tirth2216@gmail.com"

Write-Host "Setting local git config..." -ForegroundColor Cyan
git config user.name "$CORRECT_NAME"
git config user.email "$CORRECT_EMAIL"

# Ensure we aren't in a stuck state
git rebase --abort 2>$null

Write-Host "Rewriting commit history automatically..." -ForegroundColor Cyan

# This environment variable tells Git to skip opening the text editor
$env:GIT_SEQUENCE_EDITOR = ":"

# Run the rebase silently
git rebase -i --root --exec "git commit --amend --author='$CORRECT_NAME <$CORRECT_EMAIL>' --no-edit"

if ($LASTEXITCODE -eq 0) {
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "History rewritten locally!" -ForegroundColor Green
    Write-Host "Force pushing corrected history to GitHub..." -ForegroundColor Yellow
    git push origin main --force
    Write-Host "Success! All commits on GitHub are now under '$CORRECT_NAME'." -ForegroundColor Green
} else {
    Write-Host "Error: History rewrite failed. Please make sure no files are open in other editors." -ForegroundColor Red
}
