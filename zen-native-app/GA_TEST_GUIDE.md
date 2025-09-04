# Google Analytics 테스트 가이드

## 1. Firebase DebugView 활성화

### iOS 시뮬레이터에서 디버그 모드 활성화
```bash
# Xcode에서 실행 시 Arguments 추가
Product > Scheme > Edit Scheme > Run > Arguments
Arguments Passed on Launch:
-FIRDebugEnabled
```

### 실제 기기에서 테스트
```bash
# 실제 기기는 디버그 모드 없이도 이벤트가 실시간으로 전송됨
# Firebase Console > Analytics > DebugView에서 확인
```

## 2. Firebase Console에서 확인

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 Analytics > DebugView 선택
4. 앱 실행 및 이벤트 발생 시 실시간으로 확인

## 3. 구현된 이벤트 목록

### 앱 라이프사이클
- `app_open` - 앱 시작 시

### 스크린 뷰 (자동 트래킹)
- `HomePage`
- `TimerPage`
- `ReportPage`
- `OnboardingPage`

### 타이머 이벤트
- `timer_start` - 타이머 시작
- `timer_pause` - 타이머 일시정지
- `timer_resume` - 타이머 재개
- `timer_complete` - 타이머 완료
- `timer_target_set` - 목표 시간 설정

### 활동 관리
- `activity_create` - 활동 생성
- `activity_update` - 활동 수정
- `activity_delete` - 활동 삭제
- `activity_reorder` - 활동 순서 변경

### 온보딩
- `onboarding_start` - 온보딩 시작
- `onboarding_complete` - 온보딩 완료
- `tutorial_view` - 튜토리얼 보기
- `tutorial_complete` - 튜토리얼 완료

### 알림
- `notification_permission_granted` - 알림 권한 허용
- `notification_permission_denied` - 알림 권한 거부
- `notification_daily_reminder_set` - 일일 리마인더 설정
- `notification_timer_complete` - 타이머 완료 알림

### 데이터 관리
- `data_export` - 데이터 내보내기
- `data_import_success` - 데이터 가져오기 성공
- `data_import_error` - 데이터 가져오기 실패

### 리포트
- `report_view` - 리포트 조회

## 4. 테스트 시나리오

### 시나리오 1: 신규 사용자 플로우
1. 앱 실행 → `app_open`
2. 온보딩 화면 → `onboarding_start`, `screen_view: OnboardingPage`
3. 활동 선택 완료 → `onboarding_complete`
4. 홈 화면 → `screen_view: HomePage`

### 시나리오 2: 타이머 사용
1. 홈에서 활동 선택 → `screen_view: TimerPage`
2. 목표 시간 설정 → `timer_target_set`
3. 타이머 시작 → `timer_start`
4. 타이머 일시정지 → `timer_pause`
5. 타이머 재개 → `timer_resume`
6. 타이머 완료 → `timer_complete`

### 시나리오 3: 활동 관리
1. 새 활동 추가 → `activity_create`
2. 활동 이름 수정 → `activity_update`
3. 활동 삭제 → `activity_delete`
4. 활동 순서 변경 → `activity_reorder`

## 5. 빌드 및 실행

```bash
# iOS 빌드 및 실행
cd ios
pod install
npm run ios

# 또는 Xcode에서 직접 실행
open ZenApp.xcworkspace
```

## 6. 트러블슈팅

### 이벤트가 표시되지 않는 경우
1. GoogleService-Info.plist 파일이 올바른 위치에 있는지 확인
2. Firebase 프로젝트와 Bundle ID가 일치하는지 확인
3. 네트워크 연결 상태 확인
4. 디버그 모드가 활성화되어 있는지 확인

### 실시간 데이터 확인
- DebugView: 즉시 확인 가능 (디버그 모드)
- Realtime: 몇 초 내 확인 가능
- Analytics Dashboard: 24시간 후 확인 가능

## 7. 프로덕션 배포 전 체크리스트

- [ ] 디버그 모드 비활성화
- [ ] 모든 이벤트 파라미터 검증
- [ ] 개인정보 보호 정책 업데이트
- [ ] App Store 심사 가이드라인 준수 확인