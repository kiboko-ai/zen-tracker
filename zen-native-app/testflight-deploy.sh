#!/bin/bash

# TestFlight 배포 스크립트
# 사용법: ./testflight-deploy.sh

set -e

echo "🚀 TestFlight 배포 시작..."

# 1. 프로젝트 디렉토리로 이동
cd "$(dirname "$0")"

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. Pod 설치
echo "🍎 CocoaPods 의존성 설치 중..."
cd ios
pod install
cd ..

# 4. 빌드 클린
echo "🧹 이전 빌드 정리 중..."
cd ios
xcodebuild clean -workspace ZenApp.xcworkspace -scheme ZenApp -configuration Release

# 5. Archive 생성
echo "📱 Archive 생성 중..."
xcodebuild archive \
  -workspace ZenApp.xcworkspace \
  -scheme ZenApp \
  -configuration Release \
  -archivePath ../build/ZenApp.xcarchive \
  -destination 'generic/platform=iOS'

# 6. Export Options Plist 생성
echo "📝 Export 옵션 파일 생성 중..."
cat > ../build/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.anonymous.zenapp</key>
        <string>YOUR_PROVISIONING_PROFILE_NAME</string>
    </dict>
</dict>
</plist>
EOF

# 7. IPA 파일 생성
echo "📦 IPA 파일 생성 중..."
xcodebuild -exportArchive \
  -archivePath ../build/ZenApp.xcarchive \
  -exportPath ../build \
  -exportOptionsPlist ../build/ExportOptions.plist

# 8. TestFlight에 업로드
echo "☁️ TestFlight에 업로드 중..."
xcrun altool --upload-app \
  -f ../build/ZenApp.ipa \
  -t ios \
  --apiKey YOUR_API_KEY \
  --apiIssuer YOUR_ISSUER_ID

echo "✅ TestFlight 배포 완료!"
echo "📱 App Store Connect에서 테스터를 추가하고 빌드를 배포할 수 있습니다."