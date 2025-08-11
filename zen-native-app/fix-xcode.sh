#!/bin/bash

echo "Fixing Xcode configuration for React Native..."

# Check if Xcode is installed
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "❌ Xcode not found at /Applications/Xcode.app"
    echo "Please install Xcode from the Mac App Store first."
    exit 1
fi

echo "✅ Xcode found at /Applications/Xcode.app"

# Set Xcode developer directory
echo "Setting Xcode developer directory..."
echo "This will require your admin password:"
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Verify the change
XCODE_PATH=$(xcode-select -p)
echo "Xcode developer directory is now: $XCODE_PATH"

# Accept Xcode license if needed
echo "Accepting Xcode license (if needed)..."
sudo xcodebuild -license accept 2>/dev/null

# Install CocoaPods dependencies
echo "Installing CocoaPods dependencies..."
cd ios
pod install

if [ -f "ZenApp.xcworkspace" ]; then
    echo "✅ Setup complete! ZenApp.xcworkspace created successfully."
    echo ""
    echo "To run the app:"
    echo "1. Open Xcode: open ZenApp.xcworkspace"
    echo "2. Select a simulator or connect a device"
    echo "3. Press Cmd+R to build and run"
    echo ""
    echo "Or run from command line:"
    echo "cd .. && npm run ios"
else
    echo "⚠️ Warning: ZenApp.xcworkspace was not created. Check for errors above."
fi