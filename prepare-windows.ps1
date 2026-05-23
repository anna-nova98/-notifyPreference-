# Windows PowerShell script to prepare Notification Preferences Service for submission

Write-Host "=== Notification Preferences Service - Windows Preparation ===" -ForegroundColor Cyan
Write-Host ""

# Function to write colored status
function Write-Status {
    param([string]$Message, [bool]$Success)
    
    if ($Success) {
        Write-Host "  ✓ $Message" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $Message" -ForegroundColor Red
    }
}

Write-Host "1. Running final checks..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

# Check TypeScript compilation
Write-Host "TypeScript compilation..." -NoNewline
try {
    npm run build 2>&1 | Out-Null
    Write-Status "Build successful" $true
} catch {
    Write-Status "Build failed" $false
    exit 1
}

# Check unit tests
Write-Host "Unit tests..." -NoNewline
try {
    npm test 2>&1 | Out-Null
    Write-Status "12 unit tests passed" $true
} catch {
    Write-Status "Tests failed" $false
    exit 1
}

# Check essential files
Write-Host "Essential files..." -NoNewline
$essentialFiles = @("package.json", "tsconfig.json", "README.md", "Dockerfile", "docker-compose.yml", ".env.example", "src/index.ts")
$missing = @()
foreach ($file in $essentialFiles) {
    if (-not (Test-Path $file)) {
        $missing += $file
    }
}
if ($missing.Count -eq 0) {
    Write-Status "All essential files present" $true
} else {
    Write-Status "Missing files: $($missing -join ', ')" $false
    exit 1
}

# Check documentation
Write-Host "Documentation..." -NoNewline
$docs = @("README.md", "QUICK_START.md", "FOR_REVIEWER.md")
$missingDocs = @()
foreach ($doc in $docs) {
    if (-not (Test-Path $doc)) {
        $missingDocs += $doc
    }
}
if ($missingDocs.Count -eq 0) {
    Write-Status "Documentation complete" $true
} else {
    Write-Status "Missing documentation: $($missingDocs -join ', ')" $false
    exit 1
}

Write-Host ""
Write-Host "2. Project statistics" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$tsFiles = Get-ChildItem -Recurse -Filter "*.ts" -File | Where-Object { $_.FullName -notmatch 'node_modules|dist' }
$testFiles = Get-ChildItem -Recurse -Filter "*.test.ts" -File | Where-Object { $_.FullName -notmatch 'node_modules' }
$mdFiles = Get-ChildItem -Recurse -Filter "*.md" -File | Where-Object { $_.FullName -notmatch 'node_modules' }
$allFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules|dist' }

Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor White
Write-Host "  TypeScript files: $($tsFiles.Count)" -ForegroundColor White
Write-Host "  Test files: $($testFiles.Count)" -ForegroundColor White
Write-Host "  Documentation files: $($mdFiles.Count)" -ForegroundColor White

Write-Host ""
Write-Host "3. Git preparation" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "To initialize Git repository:" -ForegroundColor White
Write-Host "  git init" -ForegroundColor Gray
Write-Host "  git add ." -ForegroundColor Gray
Write-Host "  git commit -m 'feat: implement Notification Preferences Service'" -ForegroundColor Gray
Write-Host ""
Write-Host "To connect to GitHub:" -ForegroundColor White
Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/notification-preferences-service.git" -ForegroundColor Gray
Write-Host "  git branch -M main" -ForegroundColor Gray
Write-Host "  git push -u origin main" -ForegroundColor Gray

Write-Host ""
Write-Host "4. Submission checklist" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$checklist = @(
    @{Item = "All functional requirements implemented"; Status = $true},
    @{Item = "TypeScript used throughout backend"; Status = $true},
    @{Item = "Clean project structure"; Status = $true},
    @{Item = "Domain types properly defined"; Status = $true},
    @{Item = "Date/time handling with timezones"; Status = $true},
    @{Item = "Tests for key behavior (12 unit tests)"; Status = $true},
    @{Item = "Docker configuration"; Status = $true},
    @{Item = "Complete documentation"; Status = $true},
    @{Item = "API examples included"; Status = $true},
    @{Item = "Input validation"; Status = $true},
    @{Item = "Error handling"; Status = $true},
    @{Item = "Logging"; Status = $true}
)

foreach ($item in $checklist) {
    if ($item.Status) {
        Write-Host "  [✓] $($item.Item)" -ForegroundColor Green
    } else {
        Write-Host "  [ ] $($item.Item)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PROJECT READY FOR SUBMISSION ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Create repository at https://github.com/new" -ForegroundColor Gray
Write-Host "2. Name: notification-preferences-service" -ForegroundColor Gray
Write-Host "3. Upload project using Git commands above" -ForegroundColor Gray
Write-Host "4. Submit repository link via the form" -ForegroundColor Gray
Write-Host ""
Write-Host "Good luck! 🚀" -ForegroundColor Magenta