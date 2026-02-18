Write-Host "Starting Frontend Deployment..." -ForegroundColor Green

# 1. Enter frontend directory
Set-Location "frontend"

# 2. Build
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Return to root
Set-Location ".."

# 4. Force add dist folder (Crucial step)
Write-Host "Force adding dist folder to Git..." -ForegroundColor Cyan
git add -f frontend/dist

# 5. Add other changes
git add .

# 6. Commit and Push
$message = Read-Host "Enter commit message (default: 'Update frontend')"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update frontend"
}

git commit -m "$message"
git push

Write-Host "Deployment to Git complete! Now pull on your server." -ForegroundColor Green
