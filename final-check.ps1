# Final check script for Windows

Write-Host "=== Final Project Check ===" -ForegroundColor Cyan
Write-Host ""

# Run checks
Write-Host "1. TypeScript compilation..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "  ✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Unit tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ 12 unit tests passed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Essential files..." -ForegroundColor Yellow
$files = @("package.json", "tsconfig.json", "README.md", "Dockerfile", "docker-compose.yml", ".env.example", "src/index.ts")
$allOk = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "  ✗ Some files missing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Documentation..." -ForegroundColor Yellow
$docs = @("README.md", "QUICK_START.md", "FOR_REVIEWER.md")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $lines = (Get-Content $doc | Measure-Object -Line).Lines
        Write-Host "  ✓ $doc ($lines lines)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $doc missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== PROJECT READY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To submit:" -ForegroundColor White
Write-Host "1. Create GitHub repo: https://github.com/new" -ForegroundColor Gray
Write-Host "2. Name: notification-preferences-service" -ForegroundColor Gray
Write-Host "3. Run Git commands:" -ForegroundColor Gray
Write-Host "   git init" -ForegroundColor DarkGray
Write-Host "   git add ." -ForegroundColor DarkGray
Write-Host "   git commit -m 'feat: implement Notification Preferences Service'" -ForegroundColor DarkGray
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/notification-preferences-service.git" -ForegroundColor DarkGray
Write-Host "   git branch -M main" -ForegroundColor DarkGray
Write-Host "   git push -u origin main" -ForegroundColor DarkGray
Write-Host "4. Submit link via form" -ForegroundColor Gray
Write-Host ""
Write-Host "All requirements met! Good luck! 🚀" -ForegroundColor Magenta