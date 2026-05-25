# auto-push.ps1 — End-of-day auto commit & push
# Run daily via Windows Task Scheduler

param(
    [string]$RepoPath = "d:\PhatNT\AI plugin\ECC",
    [string]$Branch = "main"
)

Set-Location $RepoPath

# Check for any changes (staged, unstaged, untracked)
$status = git status --porcelain 2>&1
if (-not $status) {
    Write-Host "[auto-push] No changes. Skipping."
    exit 0
}

$date = Get-Date -Format "yyyy-MM-dd"
$changedFiles = ($status | Measure-Object -Line).Lines

Write-Host "[auto-push] $changedFiles change(s) detected. Committing..."

git add .
git commit -m "chore: daily sync $date"

$pushResult = git push origin $Branch 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "[auto-push] Push failed: $pushResult"
    exit 1
}

Write-Host "[auto-push] Pushed to $Branch successfully."
