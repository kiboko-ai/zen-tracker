# Zen App - React Native Version

## 📱 테스트 방법

### 1. Expo를 사용한 빠른 테스트 (권장)

#### 설치 및 실행
```bash
# 프로젝트 디렉토리로 이동
cd /Users/jason/zen/zen-native-app

# Expo CLI 설치
npm install -g expo-cli

# 의존성 설치
npm install expo react-native-web

# Expo로 시작
npx expo start
```

#### 테스트 방법
1. **QR 코드 스캔**: 터미널에 나타나는 QR 코드를 스캔
   - iOS: 카메라 앱으로 스캔
   - Android: Expo Go 앱으로 스캔

2. **Expo Go 앱 필요**:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

3. **웹에서 테스트**: 터미널에서 'w' 키를 누르면 웹 브라우저에서 실행

### 2. iOS 시뮬레이터 (Mac만 가능)

```bash
# Xcode 설치 필요 (App Store에서 다운로드)

# iOS 의존성 설치
cd ios && pod install && cd ..

# iOS 시뮬레이터 실행
npm run ios
```

### 3. Android 에뮬레이터

```bash
# Android Studio 설치 필요
# AVD Manager에서 가상 디바이스 생성

# Android 실행
npm run android
```

### 4. 실제 디바이스에서 테스트

#### iOS (Mac 필요)
1. Xcode에서 프로젝트 열기
2. 디바이스 연결
3. 개발자 계정으로 서명
4. Run 버튼 클릭

#### Android
1. 개발자 모드 활성화
2. USB 디버깅 켜기
3. USB로 연결
4. `npm run android` 실행

## 🚀 빠른 시작 (Expo 권장)

```bash
# 1. Expo 설치
npm install -g expo-cli

# 2. 프로젝트 초기화
cd /Users/jason/zen/zen-native-app
npx expo init . --template blank-typescript

# 3. 의존성 설치
npm install

# 4. 실행
npx expo start
```

## 📦 필요한 패키지 설치

```bash
npm install \
  @react-navigation/native \
  @react-navigation/stack \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-svg \
  react-native-circular-progress \
  date-fns \
  zustand \
  @react-native-async-storage/async-storage \
  react-native-draggable-flatlist
```

## 🎯 주요 기능

- ✅ 활동 관리 (추가/수정/삭제/재정렬)
- ✅ 타이머 기능 (시작/일시정지/정지)
- ✅ 목표 시간 설정
- ✅ 일일/주간/월간/연간 리포트
- ✅ 데이터 영구 저장 (AsyncStorage)
- ✅ 드래그 앤 드롭으로 활동 재정렬

## 🔧 트러블슈팅

### Metro 번들러 오류
```bash
npx react-native start --reset-cache
```

### iOS Pod 오류
```bash
cd ios && pod install && cd ..
```

### Android 빌드 오류
```bash
cd android && ./gradlew clean && cd ..
```

## 📱 지원 플랫폼
- iOS 12.0+
- Android 5.0+ (API 21+)
- Web (Expo)