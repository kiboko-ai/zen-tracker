#!/bin/bash

# Ensure we're on deploy_dev branch
git checkout deploy_dev
git pull origin deploy_dev

# Clean Xcode caches
rm -rf ~/Library/Developer/Xcode/DerivedData/ZenApp-*
rm -rf ZenApp.xcworkspace/xcuserdata/

# Open Xcode with the correct workspace
open ZenApp.xcworkspace

echo "✅ Xcode opened with deploy_dev branch"
echo "📱 You can now archive your app"
echo "⚠️  If branch switches back to main, run this script again"