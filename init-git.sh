#!/bin/bash

echo "=== Initializing Git Repository ==="
echo

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository
echo "1. Initializing Git repository..."
git init

if [ $? -ne 0 ]; then
    echo "Error: Failed to initialize Git repository"
    exit 1
fi
echo "✓ Git repository initialized"
echo

# Add all files
echo "2. Adding files to Git..."
git add .

if [ $? -ne 0 ]; then
    echo "Error: Failed to add files to Git"
    exit 1
fi
echo "✓ Files added to Git"
echo

# Create commit
echo "3. Creating commit..."
git commit -m "feat: implement Notification Preferences Service

- Domain layer with types, entities and interfaces
- Infrastructure layer with TypeORM repositories  
- Business logic services for preferences and evaluation
- REST API with Express controllers
- Comprehensive test suite with Jest
- Docker setup for easy deployment
- Complete documentation and examples"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create commit"
    exit 1
fi
echo "✓ Commit created"
echo

echo "=== Git Repository Ready ==="
echo
echo "Next steps:"
echo
echo "1. Create a repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name: notification-preferences-service"
echo "   - Description: Notification Preferences Service for managing user notification preferences"
echo "   - Do NOT initialize with README, .gitignore, or license"
echo
echo "2. Connect to remote repository:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/notification-preferences-service.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo
echo "3. (Optional) Create version tag:"
echo "   git tag -a v1.0.0 -m 'Release v1.0.0: Initial implementation'"
echo "   git push origin --tags"
echo
echo "=== Repository Information ==="
echo "Total files: $(git ls-files | wc -l)"
echo "Commit hash: $(git rev-parse --short HEAD)"
echo "Branch: $(git branch --show-current)"