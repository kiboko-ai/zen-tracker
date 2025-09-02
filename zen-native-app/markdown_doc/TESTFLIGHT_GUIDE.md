# TestFlight 배포 가이드

## 사전 준비사항

### 1. Apple Developer 계정 설정
1. [Apple Developer](https://developer.apple.com) 계정이 필요합니다
2. Apple Developer Program에 가입 ($99/년)
3. App Store Connect 접근 권한 확인

### 2. App Store Connect에서 앱 생성
1. [App Store Connect](https://appstoreconnect.apple.com) 로그인
2. "My Apps" → "+" 버튼 → "New App" 클릭
3. 다음 정보 입력:
   - Platform: iOS
   - App Name: Zen App
   - Primary Language: Korean (또는 원하는 언어)
   - Bundle ID: com.anonymous.zenapp
   - SKU: zenapp-001 (고유한 값)

### 3. 인증서 및 프로비저닝 프로파일 설정
1. Xcode에서 자동 서명 사용:
   - Xcode에서 프로젝트 열기
   - Target → Signing & Capabilities
   - "Automatically manage signing" 체크
   - Team 선택

### 4. API Key 생성 (자동 업로드용)
1. App Store Connect → Users and Access → Keys
2. "+" 버튼 클릭하여 새 키 생성
3. Key 다운로드 및 안전한 곳에 보관
4. Issuer ID와 Key ID 메모

## TestFlight 배포 방법

### 방법 1: Xcode를 통한 수동 배포 (권장)

1. **Xcode에서 Archive 생성:**
   ```bash
   # React Native 프로젝트 준비
   npm install
   cd ios
   pod install
   ```

2. **Xcode 열기:**
   ```bash
   open ZenApp.xcworkspace
   ```

3. **Archive 생성:**
   - 상단 메뉴에서 실제 디바이스 또는 "Any iOS Device" 선택
   - Product → Archive 클릭
   - 빌드 완료 대기 (5-10분)

4. **TestFlight에 업로드:**
   - Organizer 창이 자동으로 열림
   - 방금 생성한 Archive 선택
   - "Distribute App" 클릭
   - "App Store Connect" 선택 → Next
   - "Upload" 선택 → Next
   - 옵션 선택 후 Next
   - "Upload" 클릭

### 방법 2: 스크립트를 통한 자동 배포

1. **testflight-deploy.sh 파일 수정:**
   ```bash
   # 다음 값들을 실제 값으로 변경:
   YOUR_TEAM_ID          # Apple Developer Team ID
   YOUR_PROVISIONING_PROFILE_NAME  # 프로비저닝 프로파일 이름
   YOUR_API_KEY          # App Store Connect API Key
   YOUR_ISSUER_ID        # API Issuer ID
   ```

2. **스크립트 실행:**
   ```bash
   ./testflight-deploy.sh
   ```

## TestFlight 테스터 추가

### 내부 테스터 추가 (최대 100명)
1. App Store Connect → My Apps → 앱 선택
2. TestFlight 탭
3. "Internal Testing" → "+" 버튼
4. 테스터 이메일 추가 (Apple ID 이메일)

### 외부 테스터 추가 (최대 10,000명)
1. TestFlight 탭 → "External Testing"
2. "+" 버튼 → "Add External Testers"
3. 테스터 정보 입력
4. 빌드 선택 후 "Submit for Review"
5. 테스트 정보 작성 (Beta App Review 용)

## 테스터가 앱 설치하는 방법

1. **TestFlight 앱 설치:**
   - App Store에서 "TestFlight" 검색 및 설치

2. **초대 수락:**
   - 이메일로 받은 초대 링크 클릭
   - TestFlight 앱에서 열기
   - "Accept" 클릭

3. **앱 설치:**
   - TestFlight 앱에서 "Install" 버튼 클릭
   - 설치 완료 후 "Open" 클릭하여 테스트 시작

## 주의사항

- 빌드 번호는 매번 증가시켜야 함 (Info.plist의 CFBundleVersion)
- TestFlight 빌드는 90일 후 자동 만료
- 내부 테스터는 즉시 테스트 가능
- 외부 테스터는 Beta App Review 승인 필요 (24-48시간)

## 트러블슈팅

### "No account for team" 오류
- Xcode → Preferences → Accounts에서 Apple ID 추가

### "Provisioning profile doesn't include signing certificate" 오류
- Xcode에서 자동 서명 활성화 또는 수동으로 프로파일 다운로드

### Archive 메뉴가 비활성화
- Simulator가 아닌 실제 디바이스 또는 "Any iOS Device" 선택

## 빌드 버전 업데이트
현재 설정:
- 앱 버전: 1.0.0
- 빌드 번호: 2

다음 배포 시 빌드 번호를 3으로 증가시켜주세요.