#!/bin/bash

echo "========================================="
echo "PiBoard Display - GitHub Deployment"
echo "========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
fi

# Add remote if it doesn't exist
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Adding remote repository..."
    git remote add origin https://github.com/Am0lShah/Display-Output.git
fi

echo "Adding all files..."
git add .

echo "Committing changes..."
git commit -m "Deploy PiBoard Display webapp - $(date)"

echo "Pushing to GitHub..."
git push -u origin main

echo "========================================="
echo "Deployment complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to https://netlify.com"
echo "2. Connect your GitHub repository"
echo "3. Set build settings:"
echo "   - Base directory: raspberry-pi-display"
echo "   - Build command: npm run build"
echo "   - Publish directory: build"
echo "4. Add environment variables in Netlify dashboard"
echo ""
echo "Your webapp will be live at: https://your-site-name.netlify.app"
echo "========================================="