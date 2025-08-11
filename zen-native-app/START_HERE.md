# 🚀 Zen App 실행 방법

## 즉시 실행하기

터미널에서 다음 명령어를 순서대로 실행하세요:

```bash
# 1. 프로젝트 폴더로 이동
cd /Users/jason/zen/zen-native-app

# 2. node_modules 삭제 (깨끗한 설치를 위해)
rm -rf node_modules package-lock.json

# 3. 의존성 설치
npm install

# 4. Expo 시작
npx expo start
```

## 테스트 방법

### 📱 스마트폰에서 테스트

1. **Expo Go 앱 설치**
   - iPhone: App Store에서 "Expo Go" 검색하여 설치
   - Android: Play Store에서 "Expo Go" 검색하여 설치

2. **QR 코드 스캔**
   - 터미널에 나타나는 QR 코드를 스캔
   - iPhone: 기본 카메라 앱으로 스캔
   - Android: Expo Go 앱 내에서 스캔

### 💻 웹 브라우저에서 테스트

터미널에서 `w` 키를 누르면 웹 브라우저에서 바로 실행됩니다.

### 🔧 문제 해결

만약 오류가 발생하면:

```bash
# 캐시 삭제 후 재시작
npx expo start -c
```

## 주요 기능

✅ 활동 추가/삭제/수정
✅ 타이머 기능 (목표 시간 설정)
✅ 일시정지/재개
✅ 일일/주간/월간/연간 통계
✅ 활동 순서 재정렬 (드래그 앤 드롭)

## 앱 구조

```
zen-native-app/
├── App.tsx              # 메인 앱 진입점
├── src/
│   ├── screens/         # 화면 컴포넌트
│   │   ├── HomePage.tsx
│   │   ├── TimerPage.tsx
│   │   ├── ReportPage.tsx
│   │   └── OnboardingPage.tsx
│   └── store/
│       └── store.ts     # 상태 관리 (Zustand)
└── package.json
```

준비되셨으면 위 명령어를 실행해주세요! 🎉