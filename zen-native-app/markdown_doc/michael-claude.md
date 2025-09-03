# Zen Tracker App 분석 문서

## 📅 2025년 1월 3일 작업 내용

### 🎯 Live Activity 실시간 동기화 문제 해결
FitiRun 프로젝트의 Live Activity 구현을 참고하여 실시간 동기화 문제 완전 해결

#### 1. **Live Activity 실시간 타이머 구현**
- **문제**: Pause 상태는 동기화되지만 타이머가 실시간으로 업데이트되지 않음
- **원인**: Timer.publish와 computed property는 Live Activity에서 작동하지 않음
- **해결**: `Text(Date, style: .timer)` 사용
  ```swift
  // 일시정지 시: 정적 시간 표시
  if context.state.isPaused {
      Text(formatTime(seconds: context.state.elapsedSeconds))
  } else {
      // 실행 중: 실시간 타이머
      let adjustedStart = context.attributes.startTime.addingTimeInterval(context.state.pausedDuration)
      Text(adjustedStart, style: .timer)
  }
  ```

#### 2. **Pause/Resume 동기화**
- **pausedDuration 계산 로직 수정** (LiveActivityModule.swift)
  - Pause 시: `totalElapsed - currentSeconds`로 계산
  - Resume 시: 기존 pausedDuration 유지
- **TimerPage.tsx 수정**
  - Pause 중에는 frozen elapsed time 사용
  - Resume 시 정확한 시점부터 재개

#### 3. **Push Notification 일시정지 동기화**
- **문제**: 일시정지해도 Push Notification이 예약된 시간에 도착
- **해결**: 
  - Pause 시: 모든 예약된 알림 취소
  - Resume 시: 남은 시간 기준으로 재예약
  - 새로운 헬퍼 함수: `scheduleNotificationWithDelay()`

#### 4. **Infinity 모드 Live Activity 수정**
- **문제**: targetSeconds가 0일 때 Live Activity가 시작되지 않음
- **원인**: `if (activity && targetSeconds > 0)` 조건
- **해결**: 조건 제거, infinity 모드도 Live Activity 지원

### 📝 수정된 파일 목록

#### iOS Native (Swift/Objective-C)
1. **ios/ZenApp/LiveActivityModule.swift**
   - pausedDuration 계산 로직 개선
   - 상태 변경 감지 로그 추가

2. **ios/ZenActivityWidget/ZenActivityWidgetLiveActivity.swift**
   - Text(Date, style: .timer) 구현
   - Dynamic Island, Compact, Lock Screen 뷰 수정
   - 불필요한 Timer.publish 제거

3. **ios/ZenActivityWidget/ZenActivityAttributes.swift**
   - lastUpdateTime, pausedDuration 필드 유지

4. **중복 파일 정리**
   - ios/LiveActivityModule.* 파일들 제거 (중복)
   - ios/ZenApp/ 폴더의 파일만 사용

#### JavaScript/TypeScript
1. **src/screens/TimerPage.tsx**
   - handlePause: 알림 취소 로직 추가
   - handleResume: 알림 재예약 로직 추가
   - Infinity 모드 Live Activity 조건 수정
   - Pause 시 elapsed time freeze 처리

2. **src/services/notifications/NotificationService.ts**
   - scheduleNotificationWithDelay() 메서드 추가

3. **src/hooks/useNotifications.ts**
   - scheduleNotificationWithDelay export 추가

### 🎨 Live Activity 디자인 수정 가이드

#### 잠금화면 Live Activity 디자인을 수정하려면:

**📍 메인 파일: `/ios/ZenActivityWidget/ZenActivityWidgetLiveActivity.swift`**

```swift
// 주요 컴포넌트 구조:
1. LockScreenLiveActivityView (Line 81-148)
   - 잠금화면에 표시되는 메인 뷰
   - Header: 타이머 아이콘, 활동명, PAUSED 상태
   - Timer Display: 큰 시간 표시 (42pt)
   - Progress Bar: 목표 진행률
   - Infinity Mode: "No target set" 표시

2. DynamicIslandExpandedRegion (Line 23-58)
   - Dynamic Island 확장 뷰
   - Leading: 활동명
   - Trailing: 시간
   - Center: PAUSED 상태
   - Bottom: 진행률 바

3. Compact Mode (Line 59-73)
   - Dynamic Island 축소 뷰
   - Leading: 아이콘
   - Trailing: 시간 (간략)
```

**🎨 디자인 요소 수정 위치:**
- **색상**: `.foregroundColor()`, `.tint()` 
  - 현재: orange (#FFA500)
  - Gray for paused state
- **폰트**: `.font()` 
  - Timer: `.system(size: 42, weight: .bold, design: .monospaced)`
  - Headers: `.headline`, `.caption`
- **아이콘**: `Image(systemName:)`
  - timer, pause.circle.fill, infinity
- **레이아웃**: `VStack`, `HStack`, `spacing`
- **배경**: `.activityBackgroundTint()`

**💡 수정 예시:**
```swift
// 색상 변경
.foregroundColor(.orange) → .foregroundColor(.blue)

// 폰트 크기 변경  
.font(.system(size: 42, ...)) → .font(.system(size: 48, ...))

// 아이콘 변경
Image(systemName: "timer") → Image(systemName: "clock.fill")

// 배경색 변경
.activityBackgroundTint(Color.black.opacity(0.5)) 
→ .activityBackgroundTint(Color.purple.opacity(0.3))
```

### 📅 추가 작업 내용 (2025년 1월 3일 오후)

#### 5. **Push Notification 일시정지/재개 동기화**
- **구현 방식**: 
  - Pause 시: 모든 예약된 알림 취소
  - Resume 시: 남은 시간 기준으로 재예약
- **새로운 함수**: `scheduleNotificationWithDelay()`
- **영향받는 알림**: Goal, 2x Target, Check-in, Hourly

#### 6. **Infinity 모드 Live Activity 지원**
- **문제**: `targetSeconds > 0` 조건으로 infinity 모드에서 Live Activity 미작동
- **해결**: 조건 제거, targetMinutes = 0 전달
- **결과**: Infinity 모드에서도 Live Activity 표시

#### 7. **Live Activity 아이콘 변경**
- **PNG 이미지 시도**: Widget Extension 번들 설정 복잡으로 실패
- **최종 선택**: SF Symbol `timer.circle.fill` 사용
- **Dynamic Island**: 일시정지 시 `pause.circle.fill` 표시

#### 8. **Progress Bar 실시간 업데이트 분석**
- **제한사항**: Live Activity에서 ProgressView는 정적 (실시간 업데이트 불가)
- **실시간 가능**: `Text(Date, style: .timer)`만 자동 업데이트
- **현재 방식**: 1초마다 앱에서 업데이트 전송

### ✅ 현재 상태
- Live Activity 실시간 동기화 ✅
- Pause/Resume 완벽 동작 ✅
- Push Notification 일시정지 동기화 ✅
- Infinity 모드 지원 ✅
- 모든 파일 정리 및 중복 제거 ✅
- SF Symbol 아이콘 적용 ✅

# Zen Tracker App 분석 문서

## 앱 개요
Zen Tracker는 사용자가 다양한 활동(읽기, 명상, 쓰기, 운동 등)에 집중한 시간을 추적하는 React Native 앱입니다. 사용자는 활동을 선택하고, 타이머를 시작하여 집중 시간을 기록하며, 일/주/월/년 단위로 통계를 확인할 수 있습니다.

## 기술 스택
- **프레임워크**: React Native (Expo)
- **상태 관리**: Zustand
- **내비게이션**: React Navigation
- **데이터 저장**: AsyncStorage (로컬 저장소)
- **주요 라이브러리**: 
  - date-fns (날짜 처리)
  - react-native-svg (차트 그래픽)
  - react-native-draggable-flatlist (드래그 앤 드롭)
  - react-native-circular-progress (원형 진행률)

## 앱 플로우차트

```mermaid
graph TD
    Start([앱 시작]) --> CheckFirstTime{첫 실행?}
    CheckFirstTime -->|Yes| Tutorial[온보딩 튜토리얼]
    Tutorial --> OnboardingPage[온보딩 페이지]
    CheckFirstTime -->|No| HomePage[홈 페이지]
    
    OnboardingPage --> SelectActivities[활동 선택]
    SelectActivities --> SaveActivities[활동 저장]
    SaveActivities --> HomePage
    
    HomePage --> ViewActivities[활동 목록 보기]
    HomePage --> AddActivity[활동 추가]
    HomePage --> EditMode[편집 모드]
    HomePage --> StartTimer[타이머 시작]
    HomePage --> ViewReport[리포트 보기]
    
    EditMode --> ReorderActivities[활동 순서 변경]
    EditMode --> EditActivity[활동 수정]
    EditMode --> RemoveActivity[활동 삭제]
    
    StartTimer --> TimerPage[타이머 페이지]
    TimerPage --> SetTarget[목표 시간 설정]
    SetTarget --> RunTimer[타이머 실행]
    RunTimer --> PauseResume[일시정지/재개]
    RunTimer --> StopTimer[타이머 종료]
    StopTimer --> SaveSession[세션 저장]
    SaveSession --> ReportPage[리포트 페이지]
    
    ViewReport --> ReportPage
    ReportPage --> DailyView[일일 통계]
    ReportPage --> WeeklyView[주간 통계]
    ReportPage --> MonthlyView[월간 통계]
    ReportPage --> YearlyView[연간 통계]
    
    ReportPage --> TimelineChart[타임라인 차트]
    ReportPage --> RingsChart[링 차트]
```

## 데이터베이스 구조 및 연동

### 데이터 저장 방식
이 앱은 **외부 데이터베이스를 사용하지 않고** AsyncStorage를 통한 **로컬 저장소**만 사용합니다. 모든 데이터는 디바이스에 로컬로 저장됩니다.

### 데이터 모델

#### 1. Activity (활동)
```typescript
interface Activity {
  id: string              // 고유 ID (timestamp + random)
  name: string           // 활동명
  totalTime: number      // 총 누적 시간 (밀리초)
  lastUsed: Date        // 마지막 사용 시간
  color?: string        // 활동 색상 (선택사항)
  order?: number        // 표시 순서
  sessions?: Session[]  // 세션 목록 (선택사항)
  lastTargetHours?: number    // 마지막 목표 시간
  lastTargetMinutes?: number  // 마지막 목표 분
}
```

#### 2. Session (세션)
```typescript
interface Session {
  id: string             // 세션 ID
  activityId: string     // 연결된 활동 ID
  startTime: Date       // 시작 시간
  endTime?: Date        // 종료 시간
  duration: number      // 지속 시간 (밀리초)
  pauses: Array<{       // 일시정지 기록
    start: Date
    end?: Date  
  }>
  targetDuration?: number // 목표 시간 (밀리초)
}
```

### 상태 관리 (Zustand Store)

#### 주요 상태
- `activities`: 모든 활동 목록
- `sessions`: 모든 세션 기록
- `currentSession`: 현재 진행 중인 세션
- `isFirstTime`: 첫 실행 여부
- `selectedActivities`: 선택된 활동 목록

#### 주요 액션
- `addActivity`: 새 활동 추가
- `removeActivity`: 활동 삭제
- `updateActivity`: 활동 정보 업데이트
- `reorderActivities`: 활동 순서 변경
- `startSession`: 세션 시작
- `pauseSession`: 세션 일시정지
- `resumeSession`: 세션 재개
- `endSession`: 세션 종료

### 데이터 영속성
Zustand의 `persist` 미들웨어를 사용하여 AsyncStorage에 자동으로 저장:
```javascript
persist(
  (set, get) => ({ ... }),
  {
    name: 'zen-storage',  // 저장소 키
    storage: createJSONStorage(() => AsyncStorage)
  }
)
```

## 주요 화면 및 기능

### 1. 온보딩 페이지 (OnboardingPage)
- **첫 실행 시** 표시
- 기본 활동 6개 제공 (읽기, 명상, 쓰기, 운동, 공부, 일)
- 사용자 정의 활동 추가 가능
- 선택된 활동들을 Store에 저장

### 2. 홈 페이지 (HomePage)
- **활동 목록 표시**: 각 활동의 오늘 집중 시간 표시
- **활동 관리**: 
  - 추가: 새 활동 생성
  - 편집: 활동명 수정
  - 삭제: 활동 제거
  - 순서 변경: 드래그 앤 드롭
- **빠른 액션**: 활동 탭하여 타이머 시작

### 3. 타이머 페이지 (TimerPage)
- **목표 시간 설정**: 시간/분 선택
- **타이머 기능**:
  - 시작/일시정지/재개
  - 진행률 원형 차트 표시
  - 목표 달성 시 시각적 피드백
- **백그라운드 타이머**: BackgroundTimer 서비스로 앱이 백그라운드에서도 정확한 시간 추적

### 4. 리포트 페이지 (ReportPage)
- **기간별 통계**: 일/주/월/년 단위
- **차트 뷰**:
  - Timeline Chart: 시간대별 활동 분포
  - Rings Chart: 활동별 비율
- **통계 정보**:
  - 총 집중 시간
  - 활동별 시간 및 비율
  - 평균 집중 시간
  - 최장 세션 시간

## 백그라운드 타이머 서비스
`BackgroundTimer` 클래스는 앱이 백그라운드 상태일 때도 정확한 시간을 추적합니다:

1. **AppState 모니터링**: 앱 상태 변화 감지 (active/background)
2. **백그라운드 시간 계산**: 백그라운드 진입 시간 기록
3. **복귀 시 보정**: 포그라운드 복귀 시 놓친 인터벌 실행
4. **정확한 경과 시간**: 일시정지 시간을 제외한 실제 활동 시간 계산

## 컴포넌트 구조

### 재사용 컴포넌트
1. **OnboardingTutorial**: 첫 사용자를 위한 튜토리얼
2. **RingsChart**: 활동별 비율을 보여주는 링 차트
3. **TimelineChart**: 시간대별 활동 분포 차트

### 유틸리티
- **activityColors**: 활동별 색상 관리

## 데이터 플로우

```mermaid
graph LR
    User[사용자 액션] --> Component[React Component]
    Component --> Store[Zustand Store]
    Store --> AsyncStorage[AsyncStorage]
    AsyncStorage --> Store
    Store --> Component
    Component --> UI[UI 업데이트]
```

1. **사용자 액션**: 활동 추가, 타이머 시작 등
2. **컴포넌트에서 Store 액션 호출**: `useStore` 훅 사용
3. **Store 상태 업데이트**: Zustand가 상태 변경 관리
4. **AsyncStorage 자동 저장**: persist 미들웨어가 자동 처리
5. **UI 자동 업데이트**: Store 변경 시 구독된 컴포넌트 리렌더링

## 특징 및 장점

1. **오프라인 우선**: 모든 데이터가 로컬 저장되어 인터넷 연결 불필요
2. **실시간 동기화**: Zustand의 구독 메커니즘으로 즉각적인 UI 업데이트
3. **백그라운드 정확성**: 앱이 백그라운드에서도 정확한 시간 추적
4. **간단한 구조**: 외부 데이터베이스 없이 AsyncStorage만으로 구현
5. **사용자 프라이버시**: 모든 데이터가 디바이스에만 저장

## 향후 개선 가능 사항

1. **클라우드 동기화**: 여러 디바이스 간 데이터 동기화
2. **데이터 백업/복원**: 기기 변경 시 데이터 이전
3. **상세 분석**: 더 깊이 있는 통계 및 인사이트
4. **소셜 기능**: 친구와 활동 공유, 챌린지 기능
5. **알림 기능**: 목표 달성, 리마인더 등

---

## 2025-08-28 작업 내용

### 1. iOS 버전 업데이트 (13.4 → 16.6) ✅

**완료된 작업**:
- `ios/ZenApp.xcodeproj/project.pbxproj`에서 `IPHONEOS_DEPLOYMENT_TARGET` 16.0으로 변경
- Xcode에서 minimum deployment target 16.6으로 설정
- `ios/Podfile`에서 platform 및 모든 Pods의 deployment target 16.6으로 업데이트
- Marketing Version 1.0.4로 업데이트

### 2. 로컬 푸시 알림 시스템 구현 ✅

**구현된 기능**:
1. **목표 달성 알림**: 설정한 목표 시간에 도달 시 알림
2. **체크인 알림**: 30분마다 "아직 집중 중?" 알림
3. **세션 완료 알림**: 타이머 종료 시 완료 알림

**생성/수정된 파일**:
- `src/services/notifications/NotificationService.ts`: 핵심 알림 서비스 (Singleton 패턴)
- `src/services/notifications/LiveActivityService.ts`: Live Activity 플레이스홀더 (Coming Soon)
- `src/hooks/useNotifications.ts`: React Hook for notifications
- `src/config/notifications.config.ts`: 알림 설정 상수
- `src/screens/TimerPage.tsx`: 알림 통합
- `App.tsx`: NotificationService 초기화 추가
- `ios/ZenApp/Info.plist`: 백그라운드 모드 및 알림 권한 설정 추가

### 3. 주요 문제 해결 ✅

#### A. 프로젝트 이름 복원 문제
- **문제**: `npx expo prebuild --clean` 실행 시 ZenApp이 ZenTracker로 변경됨
- **해결**: `git restore ios/`로 원래 프로젝트 복원 후 수동으로 expo-notifications 설치

#### B. Xcode 빌드 에러
1. **ExpoPushTokenManager module not found**
   - 해결: expo-notifications 0.28.19 버전 설치
   
2. **React Native header warnings**
   - 해결: Podfile에 warning suppression 설정 추가
   
3. **Dependency graph error**
   - 해결: DerivedData 삭제, `pod deintegrate && pod install`

#### C. 알림 동작 문제
1. **목표 달성 즉시 알림 문제**
   - 원인: `delaySeconds` 파라미터 미전달
   - 해결: `useNotifications.ts`에 파라미터 추가, 타이머 시작 시 예약

2. **무한 알림 반복 문제**
   - 원인: 매 초마다 알림 발송 로직 실행
   - 해결: 타이머 시작 시 한 번만 예약, 중복 체크 로직 추가

3. **잠금화면 알림 미작동**
   - 원인: NotificationHandler 미설정, 백그라운드 모드 미활성화
   - 해결: 
     - `Notifications.setNotificationHandler` 설정
     - Info.plist에 `UIBackgroundModes` 추가
     - iOS 권한 옵션 상세 설정

### 4. 현재 구조

```
알림 시스템 아키텍처:
┌─────────────────┐
│   App.tsx       │ → NotificationService 초기화
└────────┬────────┘
         │
┌────────▼────────┐
│ NotificationService │ → Singleton 패턴
│  - 권한 관리        │
│  - 알림 스케줄링    │
│  - 중복 방지        │
└────────┬────────┘
         │
┌────────▼────────┐
│ useNotifications │ → React Hook
│  - 권한 요청        │
│  - 알림 예약        │
│  - 에러 처리        │
└────────┬────────┘
         │
┌────────▼────────┐
│   TimerPage     │ → 알림 통합
│  - 시작 시 예약    │
│  - 종료 시 취소    │
│  - 상태 관리       │
└─────────────────┘
```

### 5. Pod 설정 최종 상태
- iOS Deployment Target: 16.6
- 모든 경고 억제 설정 적용
- expo-notifications 0.28.19 통합 완료

### 6. 추가 알림 기능 구현 ✅

#### A. 무한 타이머 모드 (00:00) 
- **기능**: 목표 시간 미설정 시 매 시간마다 알림
- **구현**: `scheduleHourlyNotification()` - 1시간마다 반복
- **메시지**: "⏱️ One hour passed - You've been focusing on [활동명] for an hour. Great persistence!"

#### B. 2배 목표 달성 알림
- **기능**: 설정한 목표 시간의 2배 도달 시 알림 (타이머 실행 중일 때만)
- **구현**: `scheduleDoubleTargetNotification()` - 목표 x2 시간에 발송
- **메시지**: "🔥 Double your target! - Amazing! You've been focusing on [활동명] for X minutes - that's 2x your goal!"

#### C. 세션 완료 알림 (일시 비활성화)
- **상태**: 주석 처리로 비활성화 (`TimerPage.tsx:234-237`)
- **활성화 방법**: 주석 제거

### 7. 알림 메시지 수정 가이드 📝

각 알림 유형별 메시지 수정 위치:

#### 목표 달성 알림
```typescript
// src/services/notifications/NotificationService.ts (line 99-101)
title: '🎯 Goal Achieved!',
body: `Congratulations! You've completed ${targetMinutes} minutes of ${activityName}.`,
```

#### 체크인 알림 (30분마다)
```typescript
// src/services/notifications/NotificationService.ts (line 164-165)
title: '⏱️ Still focusing?',
body: `You've been working on ${activityName} for ${intervalMinutes} minutes. Keep going!`,
```

#### 시간당 알림 (무한 모드)
```typescript
// src/services/notifications/NotificationService.ts (line 197-198)
title: '⏱️ One hour passed',
body: `You've been focusing on ${activityName} for an hour. Great persistence!`,
```

#### 2배 목표 달성 알림
```typescript
// src/services/notifications/NotificationService.ts (line 232-233)
title: '🔥 Double your target!',
body: `Amazing! You've been focusing on ${activityName} for ${doubleMinutes} minutes - that's 2x your goal!`,
```

#### 세션 완료 알림 (비활성화됨)
```typescript
// src/services/notifications/NotificationService.ts (line 268-269)
title: '✅ Session Complete',
body: `Great job! You've completed ${totalMinutes} minutes of ${activityName}.`,
```

### 8. 권한 거부 시 표시 메시지
```typescript
// src/hooks/useNotifications.ts (line 49-50)
'Notifications Disabled',
'You have declined push notifications. To receive goal achievement alerts, please enable notifications in Settings.'
```

### 9. 에러 해결 기록

#### NotificationHandler 중복 호출 문제
- **증상**: `TypeError: undefined is not a function` at App.tsx:49
- **원인**: `Notifications.setNotificationHandler` 중복 호출
  - 파일 최상위 (line 6-12)
  - initialize() 메서드 (line 39-45)
- **해결**: 중복 제거 필요

---

## 작업 실현 가능성 분석

### 1. iOS 버전 업데이트 (13.4 → 16.0+)

**현재 상태**:
- 현재 iOS Deployment Target: **13.4**
- Live Activities 최소 요구사항: **iOS 16.1+**
- Dynamic Island 지원: **iOS 16.1+** (iPhone 14 Pro 이상)

**실현 가능성**: ✅ **가능**

**필요 작업**:
1. `ios/ZenApp.xcodeproj/project.pbxproj`에서 `IPHONEOS_DEPLOYMENT_TARGET` 변경 (13.4 → 16.1)
2. Info.plist에 Live Activities 권한 추가
3. Widget Extension 타겟 추가
4. ActivityKit 프레임워크 통합

**고려사항**:
- iOS 16 미만 사용자는 앱 사용 불가 → 사용자 베이스 감소 가능성
- 대안: 조건부 컴파일로 iOS 16+ 기능만 선택적 활성화

### 2. 로컬 알림 기능 구현

**현재 상태**:
- 푸시 알림 라이브러리: **없음**
- 백그라운드 타이머: **구현됨** (BackgroundTimer.ts)

**실현 가능성**: ✅ **가능**

**구현 방법**:

#### A. 필요 패키지 설치
```bash
expo install expo-notifications
expo install expo-task-manager  # 백그라운드 작업용
```

#### B. 제안하는 폴더 구조
```
src/
├── services/
│   ├── BackgroundTimer.ts (기존)
│   ├── NotificationService.ts (신규)
│   └── LiveActivityService.ts (신규)
├── hooks/
│   ├── useNotifications.ts (신규)
│   └── useLiveActivity.ts (신규)
├── types/
│   ├── notification.types.ts (신규)
│   └── activity.types.ts (신규)
└── config/
    └── notifications.config.ts (신규)
```

#### C. 알림 시나리오 구현

##### 1. 목표 달성 알림
```typescript
// src/services/NotificationService.ts
class NotificationService {
  // 목표 시간 달성 시 알림
  async scheduleGoalAchievedNotification(activityName: string, targetTime: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎯 목표 달성!",
        body: `${activityName} ${formatTime(targetTime)} 목표를 달성했습니다!`,
        sound: true,
        badge: 1
      },
      trigger: null // 즉시 발송
    });
  }
}
```

##### 2. 장시간 트래킹 확인 알림
```typescript
// 30분마다 체크하여 알림
async scheduleTrackingReminderNotification(activityName: string, duration: number) {
  if (duration >= 60 * 60 * 1000) { // 1시간 이상
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏱️ 아직 집중 중이신가요?",
        body: `${activityName}을(를) ${formatTime(duration)} 동안 진행 중입니다.`,
        categoryIdentifier: 'tracking-check',
        data: { activityName, duration }
      },
      trigger: {
        seconds: 1800, // 30분 후
        repeats: true
      }
    });
  }
}
```

#### D. Live Activity 구현 (iOS 16.1+)
```typescript
// src/services/LiveActivityService.ts
import { NativeModules } from 'react-native';

class LiveActivityService {
  // iOS Native Module 브릿지 필요
  private liveActivityModule = NativeModules.LiveActivityModule;
  
  async startLiveActivity(activityData: ActivityData) {
    if (Platform.OS === 'ios' && Platform.Version >= 16.1) {
      await this.liveActivityModule.startActivity(activityData);
    }
  }
  
  async updateLiveActivity(activityId: string, data: any) {
    await this.liveActivityModule.updateActivity(activityId, data);
  }
}
```

### 권장 구현 순서

1. **Phase 1: 기본 알림 구현**
   - expo-notifications 설치
   - NotificationService 구현
   - 목표 달성 알림
   - 장시간 사용 체크 알림

2. **Phase 2: iOS 버전 업데이트**
   - Deployment Target 16.1로 변경
   - 호환성 테스트

3. **Phase 3: Live Activity 구현**
   - Native Module 작성 (Swift)
   - ActivityKit 통합
   - 잠금화면 위젯 디자인

### 주의사항

1. **권한 요청 UX**:
   - 첫 실행 시 알림 권한 요청
   - 설정 화면에서 알림 타입별 on/off 제공

2. **배터리 최적화**:
   - 과도한 백그라운드 작업 방지
   - 필요한 경우에만 알림 예약

3. **테스트 고려사항**:
   - iOS Simulator는 Live Activity 미지원
   - 실제 디바이스 테스트 필요

### 결론

두 작업 모두 **실현 가능**하며, 현재 프로젝트 구조에 잘 통합될 수 있습니다:

- **iOS 버전 업데이트**: 간단한 설정 변경으로 가능
- **로컬 알림**: Expo의 notifications 패키지로 쉽게 구현 가능
- **Live Activity**: Native Module 작성 필요하지만 구현 가능

제안된 폴더 구조는 기존 코드베이스와 일관성을 유지하면서 새 기능을 깔끔하게 추가할 수 있도록 설계되었습니다.

---

## 📱 알림 시스템 구현 (2025.08.28 추가)

### 개요
iOS 16+ 타겟으로 로컬 푸시 알림 시스템을 구현했습니다. 권한이 있을 때만 알림이 작동하며, 권한 거부 시 영어 메시지를 표시합니다.

### iOS 설정 변경
- **Deployment Target**: 13.4 → **16.0** 업그레이드
- **Marketing Version**: 1.0.3 → **1.0.4**
- **Info.plist 추가**: NSUserNotificationUsageDescription
- **Live Activity 준비**: NSSupportsLiveActivities (현재 false)

### 새로 추가된 파일 구조

```
zen-native-app/
├── src/
│   ├── services/
│   │   └── notifications/
│   │       ├── NotificationService.ts      # 핵심 알림 서비스
│   │       └── LiveActivityService.ts      # Live Activity (Coming Soon)
│   ├── hooks/
│   │   └── useNotifications.ts            # React Hook for notifications
│   └── config/
│       └── notifications.config.ts        # 알림 설정 상수
├── app.json                               # 알림 설정 추가
└── 문서/
    ├── LOCAL_PUSH_SETUP.md               # 로컬 푸시 설정 가이드
    ├── LIVE_ACTIVITY_COMPATIBILITY.md    # Live Activity 호환성 분석
    ├── NOTIFICATION_PERMISSION_ANALYSIS.md # 권한 분석
    ├── PUSH_VS_INAPP_COMPARISON.md      # 푸시 vs 인앱 비교
    ├── BACKGROUND_NOTIFICATION_WORKAROUNDS.md # 백그라운드 알림 대안
    └── README_NOTIFICATIONS.md           # 알림 시스템 전체 문서
```

### 1. NotificationService.ts
**위치**: `src/services/notifications/NotificationService.ts`

**기능**:
- Singleton 패턴으로 구현된 중앙 알림 서비스
- expo-notifications 라이브러리 래핑
- 권한 관리, 알림 스케줄링, 취소 기능

**주요 메서드**:
```typescript
// 권한 요청
requestPermissions(): Promise<boolean>

// 목표 달성 알림
scheduleGoalAchievementNotification(
  activityName: string,
  targetMinutes: number
): Promise<string | null>

// 체크인 리마인더 (30분마다)
scheduleSessionCheckInReminder(
  activityName: string,
  intervalMinutes: number
): Promise<string | null>

// 세션 완료 알림
scheduleSessionCompletionNotification(
  activityName: string,
  totalMinutes: number
): Promise<string | null>
```

**특징**:
- 포그라운드에서도 알림 표시 설정
- 권한 없으면 null 반환 (graceful degradation)
- 알림 ID 반환으로 나중에 취소 가능

### 2. LiveActivityService.ts
**위치**: `src/services/notifications/LiveActivityService.ts`

**상태**: **Coming Soon** (플레이스홀더 코드)

**목적**:
- iOS 16.1+ Live Activity 지원
- 잠금화면/Dynamic Island에 실시간 타이머 표시
- **알림 권한 불필요** (큰 장점)

**구현 계획**:
```swift
// 향후 Native Module 구현 필요
- ActivityKit framework 통합
- Widget Extension 추가
- Swift native module 작성
```

### 3. useNotifications.ts
**위치**: `src/hooks/useNotifications.ts`

**기능**:
- NotificationService를 React 컴포넌트에서 쉽게 사용하는 Hook
- 권한 상태 관리
- 권한 거부 시 영어 메시지 Alert

**반환값**:
```typescript
{
  hasPermission: boolean              // 권한 여부
  isLoading: boolean                 // 초기화 중
  requestPermission(): Promise<boolean>
  showPermissionDeniedAlert(): void   // 영어 메시지 표시
  scheduleGoalNotification(): Promise<string>
  scheduleCheckInReminder(): Promise<string>
  scheduleCompletionNotification(): Promise<string>
  cancelNotification(): Promise<void>
  cancelAllNotifications(): Promise<void>
  startLiveActivity(): Promise<string> // Coming Soon
}
```

**권한 거부 메시지**:
> "You have declined push notifications. To receive goal achievement alerts, please enable notifications in Settings."

### 4. notifications.config.ts
**위치**: `src/config/notifications.config.ts`

**내용**:
- 모든 알림 관련 상수 중앙화
- 메시지 템플릿
- Feature flags
- Live Activity 설정

**설정 가능 항목**:
```typescript
{
  CHECK_IN_INTERVALS: { SHORT: 30, LONG: 60 }
  MIN_DURATION_FOR_CHECK_IN: 1800 // 30분
  MESSAGES: { /* 알림 메시지 템플릿 */ }
  LIVE_ACTIVITY: { ENABLED: false } // 준비되면 true
  FEATURES: { /* 기능별 on/off */ }
}
```

### 5. TimerPage.tsx 수정사항
**위치**: `src/screens/TimerPage.tsx`

**추가된 기능**:
1. **권한 요청**: 첫 타이머 시작 시 권한 요청
2. **목표 달성 알림**: 타겟 시간 도달 시 자동 발송
3. **체크인 리마인더**: 30분 이상 세션에서 활성화
4. **세션 완료 알림**: 타이머 종료 시 발송
5. **Live Activity 시작**: iOS 16.1+에서 자동 시도 (Coming Soon)

**코드 변경**:
```typescript
// 새로운 Hook 사용
const {
  hasPermission,
  requestPermission,
  showPermissionDeniedAlert,
  scheduleGoalNotification,
  // ...
} = useNotifications();

// handleStart에 권한 요청 로직 추가
const handleStart = async () => {
  if (!hasRequestedPermission && !hasPermission) {
    const granted = await requestPermission();
    if (!granted) {
      showPermissionDeniedAlert(); // 영어 메시지
    }
  }
  // 타이머 시작 로직...
}

// 목표 달성 시 알림 (useEffect 내부)
if (elapsed >= targetSeconds && !hasNotifiedGoal) {
  scheduleGoalNotification(activity.name, targetMinutes);
  setHasNotifiedGoal(true);
}
```

### 6. app.json 설정
**위치**: `app.json`

**추가 내용**:
```json
{
  "notification": {
    "iosDisplayInForeground": true,
    "androidMode": "default"
  },
  "ios": {
    "infoPlist": {
      "NSUserNotificationUsageDescription": "This app uses notifications...",
      "NSSupportsLiveActivities": false
    }
  }
}
```

### 알림 타입별 동작

#### 1. 목표 달성 알림
- **트리거**: 경과 시간 >= 목표 시간
- **메시지**: "🎯 Goal Achieved! Congratulations! You've completed X minutes of [activity]."
- **타이밍**: 즉시
- **중복 방지**: hasNotifiedGoal 플래그로 한 번만 발송

#### 2. 체크인 리마인더
- **트리거**: 30분 이상 세션 시작 시
- **메시지**: "⏱️ Still focusing? You've been working on [activity] for 30 minutes."
- **타이밍**: 30분마다 반복
- **취소**: 세션 종료 시 자동 취소

#### 3. 세션 완료 알림
- **트리거**: handleStop() 호출 시
- **메시지**: "✅ Session Complete. Great job! You've completed X minutes of [activity]."
- **타이밍**: 즉시

### 권한 플로우

```mermaid
graph TD
    Start[타이머 시작] --> Check{권한 체크}
    Check -->|권한 없음| Request[권한 요청]
    Request -->|승인| EnableAll[모든 알림 활성화]
    Request -->|거부| ShowMessage[영어 메시지 표시]
    Check -->|권한 있음| EnableAll
    ShowMessage --> ContinueTimer[타이머는 정상 작동]
    EnableAll --> ContinueTimer
```

### 동작 원칙
1. **No In-App Alert**: 권한 없으면 알림 자체가 없음 (in-app alert 없음)
2. **English Only**: 권한 거부 메시지는 영어로만 표시
3. **Graceful Degradation**: 권한 없어도 타이머는 정상 작동
4. **Future Ready**: Live Activity 준비 완료 (native module만 추가하면 됨)

### 패키지 의존성
```json
{
  "expo-notifications": "^0.31.4",
  "expo-device": "^7.1.4"
}
```

### 빌드 및 테스트

#### iOS 빌드 준비
1. **Pod 설치 완료**: `cd ios && pod install`
2. **Workspace 사용**: `ZenApp.xcworkspace` 열기 (xcodeproj 아님)
3. **팀 설정**: Development Team 선택 필요

#### 테스트 주의사항
- **시뮬레이터**: 푸시 알림 테스트 불가 (코드는 정상 동작)
- **실제 기기**: 모든 기능 테스트 가능
- **iOS 16+ 필수**: 이전 버전 기기에서는 앱 설치 불가

### 향후 계획

#### Phase 1 (완료) ✅
- 기본 로컬 푸시 알림 구현
- 권한 처리 및 영어 메시지
- iOS 16+ 타겟 업데이트

#### Phase 2 (Coming Soon)
- Live Activity Native Module 구현
- Widget Extension 추가
- Dynamic Island 지원

#### Phase 3 (Future)
- Android 특화 기능
- 알림 커스터마이징 옵션
- 알림 통계 및 분석

### 문제 해결 가이드

#### 빌드 에러 시
1. **Pod 관련 에러**: `cd ios && pod install`
2. **Signing 에러**: Xcode에서 Team 설정
3. **버전 충돌**: iOS Deployment Target 확인 (16.0)

#### 알림이 안 뜰 때
1. **설정 확인**: Settings > Zen Tracker > Notifications
2. **권한 상태**: 앱 내에서 권한 요청 다시 시도
3. **테스트 환경**: 실제 기기 사용 (시뮬레이터 X)

#### Live Activity 관련
- 현재 "Coming Soon" 상태
- Native Module 구현 필요
- iOS 16.1+ 에서만 작동

---

## 2025-08-29 작업 내용

### 매일 오전 9시 앱 사용 권유 푸시 알림 구현 ✅

**구현 목적**: 사용자에게 매일 정해진 시간에 앱 사용을 권유하여 꾸준한 활동 추적 습관 형성

#### 1. 구현된 기능

##### A. 일일 리마인더 핵심 기능
- **알림 시간**: 매일 오전 9시 (디바이스 로컬 시간 기준)
- **알림 메시지**: 
  - 제목: " ◉ Time to Focus"
  - 내용: "Start your day with a focused session. What will you work on today?"
- **중복 방지**: 이미 스케줄된 경우 재설정하지 않음
- **권한 의존적**: 알림 권한이 있어야만 작동

##### B. 자동 스케줄링 시점
1. **앱 초기화 시** (App.tsx:42-59)
   - 앱 시작 시 권한 확인 후 자동 설정
   - 이미 스케줄되어 있으면 중복 설정하지 않음

2. **권한 승인 시** (TimerPage.tsx:150-162)
   - 첫 타이머 사용 시 권한 요청
   - 권한이 승인되면 일일 리마인더 자동 설정

#### 2. 수정/추가된 파일

##### A. NotificationService.ts (282-383줄)
```typescript
// 새로 추가된 메서드들
async scheduleDailyReminder(): Promise<string | null>     // 일일 리마인더 스케줄링
async cancelDailyReminder(): Promise<boolean>             // 일일 리마인더 취소
async isDailyReminderScheduled(): Promise<boolean>        // 스케줄 상태 확인
```

**주요 특징**:
- CalendarTrigger 사용: `{ hour: 9, minute: 0, repeats: true }`
- 기존 daily_reminder 타입 알림 자동 취소 후 재설정
- 에러 처리 및 로깅 포함

##### B. useNotifications.ts (14-16, 140-169, 204-206줄)
```typescript
// Hook에 추가된 함수들
scheduleDailyReminder: () => Promise<string | null>       // 일일 리마인더 스케줄링
cancelDailyReminder: () => Promise<boolean>               // 일일 리마인더 취소  
isDailyReminderScheduled: () => Promise<boolean>          // 스케줄 상태 확인
```

**특징**:
- 권한 체크 후 처리
- 일일 리마인더는 중요도가 낮아 권한 거부 시 alert 표시하지 않음

##### C. App.tsx (42-59줄)
```typescript
// 앱 초기화 시 일일 리마인더 자동 설정
if (hasPermission) {
  const isScheduled = await NotificationService.isDailyReminderScheduled()
  if (!isScheduled) {
    const reminderId = await NotificationService.scheduleDailyReminder()
    if (reminderId) {
      console.log('Daily reminder scheduled at 9:00 AM:', reminderId)
    }
  }
}
```

##### D. TimerPage.tsx (47-48, 150-162줄)
```typescript
// 권한 승인 시 일일 리마인더 자동 설정
if (granted) {
  const isScheduled = await isDailyReminderScheduled()
  if (!isScheduled) {
    const reminderId = await scheduleDailyReminder()
    if (reminderId) {
      console.log('Daily reminder auto-scheduled after permission grant:', reminderId)
    }
  }
}
```

#### 3. 코드 특징

##### 검색 용이성
- **한글/영어 주석 병행**: 나중에 검색이 쉽도록 양쪽 언어로 주석 작성
- **명확한 함수명**: scheduleDailyReminder, cancelDailyReminder 등 직관적 네이밍
- **콘솔 로그**: 디버깅을 위한 명확한 로그 메시지

##### 안정성
- **중복 방지 로직**: 이미 스케줄된 알림 체크
- **에러 처리**: try-catch로 모든 비동기 작업 보호
- **권한 체크**: 알림 권한 없으면 graceful하게 처리

#### 4. 테스트 방법

1. **앱 실행** → 알림 권한 허용
2. **Console 확인**: "Daily reminder scheduled at 9:00 AM" 메시지
3. **iOS 설정 확인**: Settings > Zen Tracker > Notifications
4. **실제 테스트**: 다음날 오전 9시에 알림 수신 확인

**주의사항**:
- iOS 시뮬레이터에서는 알림 테스트 불가
- 실제 기기에서만 정상 작동
- 알림은 디바이스의 로컬 시간 기준

#### 5. 알림 타입 전체 현황

현재 구현된 알림 타입:
1. **일일 리마인더** (매일 오전 9시) - NEW ✨
2. **목표 달성 알림** - 설정한 목표 시간 도달 시
3. **체크인 알림** - 30분마다 "아직 집중 중?"
4. **시간당 알림** - 무한 모드에서 1시간마다
5. **2배 목표 달성 알림** - 목표의 2배 시간 도달 시
6. **세션 완료 알림** - 타이머 종료 시 (현재 비활성화)

#### 6. 향후 개선 사항

- 사용자가 알림 시간을 커스터마이징할 수 있는 설정 화면
- 일일 리마인더 on/off 토글 기능
- 주말 제외 옵션
- 다양한 메시지 로테이션

---

## 2025-09-02 작업 내용

### 중복 Push Notification 방지 로직 구현 ✅

**문제 상황**:
- 목표 시간이 30분의 배수일 때 (30분, 60분, 90분 등) 목표 달성 알림과 30분 체크인 알림이 동시에 발생
- 목표 시간의 2배가 30분의 배수일 때도 유사한 중복 발생 가능

**해결 방법**:
스마트 체크인 리마인더 시스템 구현 - 충돌 시점을 자동으로 감지하고 회피

#### 1. 구현된 기능

##### A. NotificationService에 새 메서드 추가
```typescript
// src/services/notifications/NotificationService.ts (183-246줄)
async scheduleSmartCheckInReminders(
  activityName: string,
  targetSeconds: number
): Promise<string[]>
```

**특징**:
- 목표 달성 시점과 2x 목표 시점을 자동으로 회피
- 30분 간격으로 체크인 알림 스케줄링
- 충돌 시점은 콘솔에 로그 출력
- 개별 알림 ID 배열 반환 (취소 시 사용)

##### B. 충돌 감지 로직
```typescript
const conflictTimes = new Set<number>();
conflictTimes.add(targetSeconds);        // 목표 달성 시점
conflictTimes.add(targetSeconds * 2);     // 2x 목표 시점

// 30분 간격 체크인 시 충돌 확인
for (let checkInTime = 1800; checkInTime <= maxDuration; checkInTime += 1800) {
  if (conflictTimes.has(checkInTime)) {
    continue; // 충돌 시점 스킵
  }
  // 알림 스케줄링
}
```

#### 2. 수정된 파일

##### A. NotificationService.ts
- `scheduleSmartCheckInReminders` 메서드 추가 (183-246줄)
- 충돌 회피 로직 구현
- 개별 알림 스케줄링으로 정확한 시점 제어

##### B. useNotifications.ts
- 인터페이스에 `scheduleSmartCheckInReminders` 추가 (13줄)
- Hook 구현체 추가 (99-111줄)
- return 객체에 메서드 추가 (218줄)

##### C. TimerPage.tsx
- `checkInNotificationIds` 상태 배열 추가 (64줄)
- 기존 단일 체크인을 스마트 체크인으로 교체 (193-199줄)
- 타이머 종료 시 모든 체크인 알림 취소 로직 추가 (237-244줄)

#### 3. 중복 방지 예시

##### 케이스 1: 목표 30분
- **이전**: 30분에 목표 달성 + 30분 체크인 (2개 알림)
- **현재**: 30분에 목표 달성만, 60분부터 체크인 시작

##### 케이스 2: 목표 15분
- **이전**: 30분에 2x 목표 + 30분 체크인 (2개 알림)  
- **현재**: 30분에 2x 목표만, 60분부터 체크인 시작

##### 케이스 3: 목표 45분
- **이전**: 90분에 2x 목표 + 90분 체크인 (2개 알림)
- **현재**: 30분, 60분 체크인 후, 90분에 2x 목표만

#### 4. 테스트 시나리오

1. **목표 30분 설정** → 30분에 목표 달성만, 60분/90분/120분에 체크인
2. **목표 15분 설정** → 15분에 목표 달성, 30분에 2x 목표, 60분/90분에 체크인
3. **목표 45분 설정** → 30분 체크인, 45분 목표 달성, 60분 체크인, 90분 2x 목표
4. **목표 60분 설정** → 30분 체크인, 60분 목표 달성만, 90분 체크인, 120분 2x 목표

#### 5. 주요 개선 사항

- **중복 알림 완전 제거**: 모든 30분 배수 충돌 케이스 처리
- **유연한 스케줄링**: 충돌 시점만 스킵하고 나머지는 정상 진행
- **명확한 로그**: 충돌 회피 시 콘솔에 명시적 로그 출력
- **개별 관리**: 각 체크인 알림을 개별 ID로 관리하여 정확한 취소 가능

#### 6. TypeScript 에러

프로젝트에 기존 TypeScript 에러가 있으나 이번 수정과는 무관:
- `react-native-wheely` 모듈 타입 선언 누락 (기존 문제)
- TimerPage.tsx 383, 402줄 파라미터 타입 누락 (기존 문제)

새로 추가한 코드는 TypeScript 에러 없음 확인 ✅

---

## 2025-09-01 작업 내용

### 1. 데이터 Export/Import 기능 구현 ✅

#### A. Export 기능
**구현 내용**:
- Report 페이지 우측 상단에 Export 버튼(💾) 추가
- JSON/CSV 두 가지 형식 지원
- iOS/Android Share Sheet를 통한 파일 공유
- 파일명 자동 생성 규칙:
  - 단일 월: `zen_202501.json`
  - 여러 월: `zen_2025_01-03.json` 
  - 여러 연도: `zen_202412-202503.json`

**기술 구현**:
- `react-native-fs`를 사용한 임시 파일 생성
- Share API를 통한 파일 공유 (권한 불필요)
- Base64 인코딩 대신 파일 URL 방식 사용 (안정성 향상)

#### B. Import 기능
**구현 내용**:
- Report 페이지 우측 상단에 Import 버튼(📂) 추가
- `expo-document-picker`를 통한 파일 선택
- 3가지 Import 모드:
  - Replace All: 전체 데이터 교체
  - Merge: 중복 제거하며 병합
  - Append: 새 ID로 추가

**Store 개선**:
- `importData` 메서드 추가 (src/store/store.ts)
- 실제 데이터 저장 및 상태 업데이트 구현

**생성/수정된 파일**:
- `src/services/dataTransfer/ExportService.ts`: Export 로직
- `src/services/dataTransfer/ImportService.ts`: Import 로직 및 검증
- `src/utils/base64.ts`: Base64 인코딩 유틸리티
- `src/screens/ReportPage.tsx`: UI 통합

### 2. iOS Share Sheet 에러 해결 ✅

**문제**:
- data URL 방식으로 큰 데이터 전송 시 시스템 에러 발생
- "View Service terminated" 및 "Client not entitled" 에러

**해결**:
- `react-native-fs` 설치 및 파일 시스템 사용
- 임시 디렉토리에 파일 생성 후 file:// URL로 공유
- 공유 완료 후 자동 정리 로직 추가

### 3. Push Notification 즉시 울리는 문제 수정 ✅

**문제 원인**:
- `scheduleGoalAchievementNotification`에서 `delaySeconds` 파라미터 미전달
- `trigger: null`이 되어 즉시 알림 발송

**해결**:
- TimerPage.tsx: `scheduleGoalNotification` 호출 시 `targetSeconds` 전달
- useNotifications.ts: 인터페이스에 `delaySeconds` 파라미터 추가
- 이제 실제 목표 시간 도달 시에만 알림 발송

### 4. UI/UX 개선 ✅

#### Export/Import 버튼 개선
- 이모지 아래 작은 텍스트 라벨 추가
- Import: 📂 + "import" (빨간색, 9px)
- Export: 💾 + "export" (빨간색, 9px)
- 시각적 명확성 향상

### 5. TypeScript 에러 수정 ✅

**수정 내용**:
- RingsChart: `rings` 배열 타입 명시
- useNotifications: 누락된 메서드 인터페이스 추가
- DocumentPicker: 최신 API 대응
- Navigation 타입 캐스팅
- Share API 타입 처리

### 6. 패키지 설치 및 의존성 관리 ✅

**설치된 패키지**:
```json
{
  "expo-document-picker": "^13.1.6",
  "react-native-fs": "^2.20.0"
}
```

**iOS 의존성**:
- `pod install` 실행으로 iOS 의존성 동기화
- ExpoDocumentPicker, RNFS 포드 추가

### 7. 데이터 구조 문서화

**Export 데이터 형식**:
```json
{
  "version": "1.0.0",
  "exportDate": "2025-09-01T10:30:00.000Z",
  "deviceInfo": {
    "platform": "iOS",
    "appVersion": "1.0.4"
  },
  "data": {
    "activities": [...],
    "sessions": [...],
    "currentSession": null,
    "isFirstTime": false,
    "selectedActivities": [...]
  },
  "statistics": {
    "totalActivities": 3,
    "totalSessions": 10,
    "totalFocusTime": 3600000,
    "averageSessionDuration": 360000,
    "mostUsedActivity": "Study",
    "lastActivityDate": "2025-09-01T09:00:00.000Z"
  }
}
```

### 8. 주요 문제 해결 기록

#### A. Import 기능이 실제로 저장되지 않던 문제
- **원인**: ImportService가 데이터만 반환하고 실제 Store 업데이트 누락
- **해결**: Store에 `importData` 메서드 추가 및 연결

#### B. 파일명 생성 로직 개선
- **변경 전**: `zen-tracker-backup-timestamp.json`
- **변경 후**: 데이터 기간을 반영한 의미있는 파일명

### 9. 테스트 완료 항목

- ✅ JSON Export/Import 정상 작동
- ✅ CSV Export 정상 작동
- ✅ 파일명 자동 생성 확인
- ✅ iOS Share Sheet 안정성 확인
- ✅ 3가지 Import 모드 작동 확인
- ✅ Push Notification 타이밍 정상 작동
- ✅ TypeScript 에러 없음 확인

### 10. 현재 브랜치 상태
- **브랜치명**: feature/data-export-import-250901
- **베이스 브랜치**: feature/live-activity-250827
- **주요 기능**: 데이터 백업/복원 기능 완성

---

## 2025-09-02 작업 내용 (화요일 19:57)

### iOS Live Activity 구현 완료 ✅

**목적**: iOS 16.1+ 기기에서 잠금화면에 실시간 타이머를 표시하여 사용자가 앱을 열지 않고도 진행 상황 확인

#### 1. Live Activity 완전 구현

##### A. 핵심 기능
- **자동 업데이트 타이머**: `Text(timerInterval:)` 사용으로 수동 업데이트 불필요
- **잠금화면 표시**: 활동명, 실시간 타이머, 진행률 바
- **Dynamic Island 지원**: iPhone 14 Pro+ 기기에서 컴팩트/확장 뷰
- **백그라운드 동작**: 앱이 백그라운드에서도 타이머 계속 표시

##### B. 기술 구현
- **Native Module**: Swift로 구현된 LiveActivityModule
- **Widget Extension**: ZenActivityWidget 타겟 추가
- **ActivityKit Framework**: iOS 16.1+ Live Activity API 활용
- **React Native Bridge**: Objective-C 브릿지로 JS와 연결

#### 2. 생성/수정된 파일

##### A. Native Module 파일
```
ios/ZenApp/
├── LiveActivityModule.swift       # Live Activity 관리 Native Module
├── LiveActivityModule.m           # Objective-C 브릿지
└── ZenApp-Bridging-Header.h      # Swift-ObjC 브릿지 헤더
```

##### B. Widget Extension 파일
```
ios/ZenActivityWidget/
├── ZenActivityWidgetBundle.swift          # Widget 번들 (@main)
├── ZenActivityWidgetLiveActivity.swift    # Live Activity UI
├── ZenActivityWidget.swift                # 홈 스크린 위젯 (placeholder)
├── ZenActivityWidgetControl.swift         # Control 위젯 (placeholder)
└── Info.plist                            # Widget 설정
```

##### C. TypeScript 통합
```
src/services/notifications/
└── LiveActivityService.ts         # Live Activity 서비스 (완성)
```

#### 3. 주요 문제 해결 과정

##### A. Live Activity가 잠금화면에 표시되지 않던 문제
- **원인**: Info.plist 설정 누락, Mock 구현 상태
- **해결**: 
  - NSSupportsLiveActivities = true 설정
  - 실제 ActivityKit 코드 구현
  - Widget Extension 타겟 추가

##### B. 타이머가 업데이트되지 않던 문제 (가장 어려웠던 이슈)
- **증상**: 잠금화면에서 0:00 또는 0:01에서 멈춤
- **시도한 방법들**:
  1. 매초 update() 호출 → 실패
  2. liveActivityId를 useEffect 의존성 추가 → 실패
  3. staleDate, relevanceScore 조정 → 실패
- **최종 해결**: `Text(timerInterval:)` SwiftUI 컴포넌트 사용
  ```swift
  Text(timerInterval: context.attributes.startTime...endDate, countsDown: false)
  ```

##### C. Widget Extension 컴파일 에러
- **에러**: "The compiler is unable to type-check this expression in reasonable time"
- **원인**: 복잡한 View 구조로 인한 타입 추론 시간 초과
- **해결**: LockScreenLiveActivityView를 별도 struct로 분리

##### D. Info.plist 설정 에러
- **에러**: "NSExtensionPrincipalClass key is not allowed for widgetkit-extension"
- **해결**: NSExtensionPrincipalClass 키 제거 (@main 어노테이션 사용)

#### 4. 잠금화면 디자인 커스터마이징 가이드

잠금화면 UI를 수정하려면 아래 파일을 편집하세요:

##### 📍 수정 위치: `/ios/ZenActivityWidget/ZenActivityWidgetLiveActivity.swift`

##### LockScreenLiveActivityView 구조 (52-94줄)
```swift
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<ZenActivityAttributes>
    
    var body: some View {
        VStack(spacing: 12) {
            // 1️⃣ 헤더 영역 (58-64줄)
            HStack {
                Image(systemName: "timer")          // 아이콘
                    .foregroundColor(.orange)        // 아이콘 색상
                Text(context.attributes.activityName) // 활동명
                    .font(.headline)                 // 폰트 스타일
                Spacer()
            }
            
            // 2️⃣ 타이머 영역 (66-72줄)
            Text(timerInterval: ...)               // 자동 업데이트 타이머
                .font(.largeTitle)                 // 폰트 크기
                .fontWeight(.bold)                 // 폰트 굵기
                .monospacedDigit()                 // 고정폭 숫자
                .foregroundColor(.white)           // 텍스트 색상
            
            // 3️⃣ 진행률 바 영역 (74-90줄)
            ProgressView(value: progress)
                .tint(.orange)                     // 진행률 바 색상
            
            HStack {
                Text("목표: \(targetMinutes)분")    // 목표 시간 텍스트
                    .font(.caption)
                    .foregroundColor(.gray)
                Spacer()
                Text("\(Int(progress * 100))%")    // 퍼센티지
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()                                 // 전체 패딩
    }
}
```

##### 커스터마이징 예시

1. **색상 변경**:
   ```swift
   .foregroundColor(.blue)  // 원하는 색상으로 변경
   .tint(.green)           // 진행률 바 색상 변경
   ```

2. **아이콘 변경**:
   ```swift
   Image(systemName: "flame.fill")  // SF Symbols 아이콘
   ```

3. **폰트 변경**:
   ```swift
   .font(.system(size: 40, weight: .heavy, design: .rounded))
   ```

4. **레이아웃 변경**:
   ```swift
   VStack(spacing: 20)  // 간격 조정
   HStack(alignment: .center)  // 정렬 변경
   ```

#### 5. Dynamic Island 커스터마이징 (iPhone 14 Pro+)

##### 📍 수정 위치: 같은 파일의 35-47줄

```swift
DynamicIsland {
    // 확장 뷰
    DynamicIslandExpandedRegion(.center) {
        Text(context.attributes.activityName)
    }
} compactLeading: {
    // 왼쪽 컴팩트 뷰
    Image(systemName: "timer")
} compactTrailing: {
    // 오른쪽 컴팩트 뷰
    Text("\(context.state.elapsedSeconds / 60)m")
} minimal: {
    // 최소화 뷰
    Image(systemName: "timer")
}
```

#### 6. 현재 Live Activity 동작 상태

✅ **정상 작동 기능**:
- 타이머 시작 시 Live Activity 자동 시작
- 잠금화면에서 실시간 타이머 자동 업데이트
- 진행률 바 표시
- 타이머 종료 시 Live Activity 자동 제거
- iPhone X/XS (iOS 16.6+) 완벽 지원

⚠️ **제한사항**:
- Dynamic Island는 iPhone 14 Pro 이상에서만 표시
- iOS 16.1 미만 기기에서는 사용 불가
- 시뮬레이터에서는 테스트 불가 (실제 기기 필요)

#### 7. 테스트 완료 항목

- ✅ Native Module 연결 확인
- ✅ Widget Extension 빌드 성공
- ✅ Live Activity 잠금화면 표시
- ✅ 타이머 자동 업데이트 작동
- ✅ 진행률 바 정상 표시
- ✅ 앱 종료 시 알림 자동 취소
- ✅ TypeScript 에러 없음

#### 8. 기술 스택 요약

- **iOS Native**: Swift 5, ActivityKit, WidgetKit
- **Bridge**: Objective-C, React Native Native Modules
- **Widget**: SwiftUI, Widget Extension
- **TypeScript**: LiveActivityService 통합
- **최소 iOS 버전**: 16.1 (Live Activity 요구사항)

#### 9. 향후 개선 가능 사항

- 홈 스크린 위젯 구현 (ZenActivityWidget.swift 활용)
- 일시정지 상태 표시 추가
- 커스텀 알림음 추가
- Apple Watch 연동
- 여러 활동 동시 추적 지원

---

## 2025-09-02 작업 내용 추가 (Live Activity 일시정지 문제)

### Live Activity 일시정지 기능 구현 시도

**목표**: TimerPage.tsx에서 일시정지 버튼을 누르면 잠금화면의 Live Activity 타이머도 일시정지되도록 구현

#### 문제 상황
앱에서 일시정지 버튼을 눌러도 잠금화면의 Live Activity가 계속 실행되는 문제가 지속됨.

#### 시도한 해결 방법들

##### 1. isPaused 상태 전달 방식
- LiveActivityService.ts의 updateActivity 메서드에 isPaused 파라미터 추가
- LiveActivityModule.swift에 updateActivityWithPause 메서드 구현
- ZenActivityAttributes.ContentState에 isPaused 필드 추가
- **결과**: 파라미터는 전달되나 Widget UI가 반응하지 않음

##### 2. Widget UI 조건부 렌더링
```swift
Group {
    if context.state.isPaused {
        // 일시정지: 고정된 시간 표시
        Text(formatTime(seconds: context.state.elapsedSeconds))
            .foregroundColor(.gray)
    } else {
        // 실행 중: 자동 업데이트 타이머
        Text(timerInterval: ...)
            .foregroundColor(.white)
    }
}
```
- **문제**: `Text(timerInterval:)` 사용 시 일시정지 불가, formatTime 사용 시 자동 업데이트 불가

##### 3. pausedDuration 방식 (Fiti-Run 참고)
- 일시정지 시간을 누적하여 startTime 조정
- pausedDuration을 ContentState에 추가
- Widget에서 adjustedStart 계산: `startTime + pausedDuration`
- **결과**: 복잡도만 증가하고 여전히 작동하지 않음

##### 4. 별도 pauseActivity/resumeActivity 메서드
- 전용 pause/resume 메서드 생성
- Objective-C 브릿지 시그니처 매칭
- **문제**: NSRangeException, undefined is not a function 에러 반복

#### 근본적인 문제점
1. **iOS 제약사항**: `Text(timerInterval:)`은 자동 업데이트는 되지만 일시정지 제어가 어려움
2. **상태 동기화**: React Native → Native Module → Widget Extension 간 상태 전달 복잡
3. **ActivityKit 한계**: Live Activity는 실시간 업데이트보다는 정적 정보 표시에 최적화됨

#### 현재 상태
- Live Activity 기본 기능(시작, 자동 업데이트, 종료)은 정상 작동
- **일시정지 기능은 미구현 상태로 남음**
- 사용자는 앱에서 일시정지를 눌러도 잠금화면 타이머는 계속 진행됨을 인지해야 함

#### 대안 고려사항
1. 일시정지 시 Live Activity를 완전히 종료하고 재개 시 새로 시작
2. 일시정지 상태를 텍스트로만 표시 (타이머는 계속 진행)
3. Live Activity 대신 일반 로컬 알림 사용

#### 결론
iOS의 Live Activity는 실시간 스포츠 스코어, 배달 추적 등 지속적으로 업데이트되는 정보를 표시하는 데 최적화되어 있으며, 정밀한 타이머 제어(일시정지/재개)에는 제한사항이 있음. 현재 기술적 제약으로 인해 완벽한 일시정지 동기화는 구현하지 못함.

---

## 2025-09-02 추가 작업 (Live Activity 심층 분석)

### Fiti-Run과 Zen-Tracker 비교 분석

#### Fiti-Run 구현 방식
1. **파일 구조**:
   - `ios/FitiRunWidget/RunningActivityAttributes.swift`: Live Activity 데이터 모델
   - `ios/FitiRunWidget/FitiRunLiveActivity.swift`: Widget UI 구현
   - `ios/FitiRunWidget/FitiRunWidgetBundle.swift`: Widget Bundle (@main)
   - `ios/FitiRunNative/LiveActivityModule.swift`: Native Module

2. **핵심 동작**:
   - **5초마다 업데이트** 전송 (백그라운드에서도)
   - 일시정지 상태에서도 계속 업데이트
   - Widget은 Timer 없이 단순 computed property 사용
   ```swift
   var actualElapsedTime: String {
       let now = Date()
       let elapsed = now.timeIntervalSince(context.attributes.startTime) - context.state.pausedDuration
       return formatTime(elapsed)
   }
   ```

#### Zen-Tracker 초기 문제점
1. **30초마다만 업데이트** (너무 긴 주기)
2. **일시정지 시 업데이트 중단** (`if (!isPaused)` 조건)
3. **Widget에 Timer Publisher 추가 시도** (Live Activity는 자체 타이머 지원 안 함)
4. **복잡한 시간 계산 로직**

### iOS Live Activity의 근본적 제약사항

#### 1. Live Activity는 독립 프로세스
- Widget Extension은 **별도 프로세스**에서 실행
- 앱과 **메모리 공유 불가**
- Widget은 **자체 코드 실행 불가** (수동적)

#### 2. Widget은 "Static View"
```swift
// ❌ 작동하지 않는 코드
struct LockScreenView: View {
    @State var timer = Timer.publish(every: 1, ...) // 실행 안 됨
    
    var body: some View {
        Text("\(Date())") // 자동 업데이트 안 됨
    }
}
```
- **자체 Timer 실행 불가**
- `onReceive`, `onAppear` 등 이벤트 핸들러 **작동 안 함**
- 업데이트를 받을 때만 UI 갱신

#### 3. 백그라운드 실행 제한
- JavaScript 타이머 제한 (iOS 배터리 절약)
- `BackgroundTimer`도 제한적
- Live Activity 업데이트 불규칙

#### 4. Apple의 의도적 설계
- **배터리 수명** 보호 우선
- **시스템 리소스** 절약
- 간헐적 업데이트용으로 설계 (실시간 타이머 X)

### 최종 해결 방법

#### TimerPage.tsx 수정
```typescript
// 이전 (문제)
if (isRunning && !isPaused && startTimeRef.current) {
    // 일시정지하면 interval 중단
}

// 수정 (해결)
if (isRunning && startTimeRef.current) {
    const id = BackgroundTimer.setBackgroundInterval(() => {
        // 일시정지 중에도 계속 실행
        if (!isPaused) {
            setSeconds(elapsed) // UI만 업데이트
        }
        // Live Activity는 항상 업데이트
        if (liveActivityId) {
            LiveActivityService.updateActivity(liveActivityId, elapsed, isPaused)
        }
    }, 1000)
}
```

#### ZenActivityWidgetLiveActivity.swift 수정
```swift
// 이전 (복잡)
var actualElapsedTime: String {
    if context.state.isPaused {
        return formatTime(seconds: context.state.elapsedSeconds)
    } else {
        let now = Date()
        let elapsed = now.timeIntervalSince(context.attributes.startTime) - context.state.pausedDuration
        return formatTime(seconds: Int(elapsed))
    }
}

// 수정 (단순)
var actualElapsedTime: String {
    // 앱에서 받은 값 그대로 표시
    return formatTime(seconds: context.state.elapsedSeconds)
}
```

### 핵심 인사이트

#### 왜 잠금화면 타이머가 멈춰있는가?
1. **Widget은 자체 타이머를 실행할 수 없음**
2. **앱에서 업데이트를 보내야만 변경됨**
3. **백그라운드에서는 업데이트가 제한적**

#### 실제 작동 방식
1. 앱이 매초 `elapsedSeconds` 값을 계산해서 전송
2. Widget은 받은 값을 **그대로 표시**만 함
3. 일시정지 시에도 계속 업데이트 (값은 고정)
4. Widget은 "display-only" 역할

### 한계와 대안

#### 완벽한 실시간 타이머는 불가능
- iOS의 근본적 제약사항
- 배터리/성능 최적화 때문에 의도적 제한

#### 차선책
1. **포그라운드**: 매초 업데이트 ✅
2. **백그라운드**: 5-10초 주기 (배터리 고려)
3. **일시정지**: 즉시 반영 (마지막 값 고정)

#### Apple 공식 대안
1. **Push Notification**으로 업데이트 (서버 필요)
2. **ActivityKit 타이머 API** (제한적)
3. **Dynamic Island**에서만 부분 지원

### 교훈
- Live Activity는 "실시간 타이머"용이 아님
- 주기적 업데이트 + 정적 표시가 한계
- iOS 시스템 제약을 이해하고 설계해야 함
- Fiti-Run도 5초 단위로 "점프"하는 방식

---

## 2025-01-03 작업 내용

### 1. 테스트용 30분 알림 구현 ✅

**목적**: 매일 오전 9시 알림이 작동하지 않는 문제를 디버깅하기 위해 30분마다 반복 알림 구현

#### A. 구현 파일

##### NotificationService.ts (451-546줄)
```typescript
// 새로 추가된 테스트 메서드들
async scheduleTestReminder(): Promise<string | null>  // 30분마다 테스트 알림
async cancelTestReminder(): Promise<boolean>          // 테스트 알림 취소
async isTestReminderScheduled(): Promise<boolean>     // 테스트 알림 상태 확인

// 알림 내용
title: '◉ Time to Focus (Test)'
body: 'This is a test notification. It will repeat every 30 minutes.'
trigger: { seconds: 1800, repeats: true }  // 30분 = 1800초
```

##### App.tsx (44줄)
```typescript
const TEST_MODE = true; // 테스트 모드 활성화/비활성화
```

#### B. 원상복구 방법

**테스트 완료 후 프로덕션 모드로 전환:**
1. App.tsx 44번 줄 수정: `const TEST_MODE = false;`
2. 앱 재시작하면 자동으로:
   - 테스트 알림 취소
   - 매일 오전 9시 알림으로 전환

#### C. 테스트 결과 대기 중
- 첫 알림: 앱 실행 후 30분
- 이후: 30분마다 계속 반복
- 확인사항: 잠금화면, 백그라운드 상태에서도 정상 작동하는지

---

### 2. Zen과 Fiti-Run의 Widget 구조 차이점 분석 🔍

#### A. Widget Bundle 구조 차이

**Zen-Tracker (ZenActivityWidgetBundle.swift)**
```swift
@main
struct ZenActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        ZenActivityWidget()         // ✅ 홈 스크린 위젯 (구현됨)
        ZenActivityWidgetControl()   // ✅ Control 위젯 (placeholder)
        ZenActivityWidgetLiveActivity() // ✅ Live Activity
    }
}
```

**Fiti-Run (FitiRunWidgetBundle.swift)**
```swift
@main
struct FitiRunWidgetBundle: WidgetBundle {
    var body: some Widget {
        FitiRunLiveActivityWidget()  // ⚠️ Live Activity만 있음
    }
}
```

#### B. 핵심 차이점

| 항목 | Zen-Tracker | Fiti-Run |
|-----|------------|----------|
| **홈 스크린 위젯** | ✅ 구현됨 (ZenActivityWidget) | ❌ 없음 |
| **Control 위젯** | ✅ 구현됨 (placeholder) | ❌ 없음 |
| **Live Activity** | ✅ 구현됨 | ✅ 구현됨 |
| **별도 데이터 모델** | ❌ 통합됨 | ✅ RunningActivityAttributes.swift |
| **위젯 Bundle 개수** | 3개 | 1개 |

#### C. 홈 스크린 위젯 차이로 인한 현상

**Zen-Tracker의 동작:**
1. 앱을 길게 누르면 → "위젯 편집" 메뉴 표시
2. 홈 스크린에 위젯 추가 가능
3. `ZenActivityWidget`이 `StaticConfiguration`으로 구성됨
4. 5시간 동안의 Timeline 제공 (1시간마다 업데이트)

**Fiti-Run의 동작:**
1. 앱을 길게 누르면 → 위젯 메뉴 없음
2. Live Activity만 지원 (잠금화면/Dynamic Island)
3. 홈 스크린 위젯 기능 없음

#### D. 일시정지 동기화 문제 원인

**구조적 문제:**
1. **Zen**: 홈 스크린 위젯과 Live Activity가 동시 존재
   - 두 위젯 간 상태 동기화 복잡
   - Timeline Provider와 ActivityKit의 충돌 가능성

2. **Fiti-Run**: Live Activity만 존재
   - 단순한 구조로 충돌 없음
   - 일시정지 상태 관리가 상대적으로 간단

**코드 레벨 문제:**
```swift
// Zen: ContentState에 pausedDuration 추가했지만 활용 안 됨
public var pausedDuration: TimeInterval  // 누적된 일시정지 시간

// Fiti-Run: pausedDuration을 실제로 계산에 사용
var actualElapsedTime: String {
    let elapsed = now.timeIntervalSince(startTime) - pausedDuration
    return formatTime(elapsed)
}
```

#### E. 권장 해결 방안

**Option 1: 홈 스크린 위젯 제거 (Fiti-Run 방식)**
```swift
// ZenActivityWidgetBundle.swift 수정
@main
struct ZenActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        ZenActivityWidgetLiveActivity()  // Live Activity만 남김
    }
}
```
- 장점: 구조 단순화, 충돌 제거
- 단점: 홈 스크린 위젯 기능 상실

**Option 2: 홈 스크린 위젯 비활성화 (임시)**
```swift
@main
struct ZenActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        // ZenActivityWidget()  // 주석 처리
        // ZenActivityWidgetControl()  // 주석 처리
        ZenActivityWidgetLiveActivity()
    }
}
```
- 장점: 나중에 쉽게 복구 가능
- 단점: 코드는 남아있어 혼란 가능

**Option 3: 완전 재구현 (권장)**
1. Fiti-Run의 구조를 참고하여 Live Activity만 집중
2. 별도 데이터 모델 파일 생성
3. 일시정지 로직 완전 재작성
4. 홈 스크린 위젯은 나중에 별도 프로젝트로

#### F. 결론

**Zen-Tracker가 복잡한 이유:**
- 3개의 위젯을 동시에 관리하려다 보니 상태 동기화 문제 발생
- 홈 스크린 위젯의 Timeline과 Live Activity의 실시간 업데이트가 충돌
- 초기 템플릿 코드가 그대로 남아있어 불필요한 복잡도 증가

**Fiti-Run이 단순한 이유:**
- Live Activity 하나만 집중적으로 구현
- 홈 스크린 위젯 없어서 Timeline Provider 충돌 없음
- 명확한 단일 목적: 러닝 추적용 Live Activity

**추천: Live Activity만 남기고 재구현하는 것이 가장 깔끔한 해결책**

---

### 3. Live Activity 전용 구조로 재구현 완료 ✅

**작업 일시**: 2025-01-03 12:00

#### A. 구조 변경 내용

**변경 전 (복잡한 구조):**
```
ZenActivityWidget/
├── ZenActivityWidget.swift (홈 스크린 위젯) ❌
├── ZenActivityWidgetControl.swift (Control 위젯) ❌
├── ZenActivityWidgetBundle.swift (3개 위젯 번들)
└── ZenActivityWidgetLiveActivity.swift (Live Activity)
```

**변경 후 (단순한 구조):**
```
ZenActivityWidget/
├── ZenActivityAttributes.swift (데이터 모델) ✅ NEW
├── ZenActivityWidgetBundle.swift (Live Activity만)
├── ZenActivityWidgetLiveActivity.swift (개선된 UI)
└── backup_20250103/ (백업 폴더)
```

#### B. 주요 개선사항

1. **별도 데이터 모델 파일 생성** (`ZenActivityAttributes.swift`)
   - ContentState에 `totalPausedSeconds`, `pauseStartTime` 추가
   - ActivityType enum 추가 (활동별 이모지, 색상)
   - 더 명확한 구조화

2. **Widget Bundle 단순화**
   ```swift
   @main
   struct ZenActivityWidgetBundle: WidgetBundle {
       var body: some Widget {
           ZenActivityWidgetLiveActivity()  // Live Activity만
       }
   }
   ```

3. **일시정지 UI 개선**
   - 일시정지 상태일 때 "PAUSED" 배지 표시
   - 타이머 색상 변경 (흰색 → 회색)
   - Dynamic Island에도 pause 아이콘 표시

4. **삭제된 파일**
   - `ZenActivityWidget.swift` (백업: backup_20250103/)
   - `ZenActivityWidgetControl.swift` (백업: backup_20250103/)

#### C. 다음 단계

1. **Xcode에서 프로젝트 재빌드 필요**
   - 삭제된 파일 참조 제거
   - 새 파일 (ZenActivityAttributes.swift) 추가
   - Clean Build (Cmd+Shift+K) 후 빌드

2. **LiveActivityModule.swift 수정 필요**
   - 새로운 ContentState 구조에 맞게 업데이트
   - elapsedSeconds를 직접 전달하는 방식으로 변경

3. **TimerPage.tsx 수정 필요**
   - 매초마다 elapsedSeconds 계산해서 전송
   - 일시정지 중에도 계속 업데이트 (값은 고정)

#### D. 예상 효과

- 홈 스크린 위젯과의 충돌 제거
- 더 단순하고 안정적인 구조
- 일시정지 동기화 문제 해결 가능성 증가
- Fiti-Run과 유사한 구조로 검증된 패턴 적용

---

### 4. Target Membership 완전 정리 및 NSRangeException 해결 ✅

**작업 일시**: 2025-01-03 13:00

#### A. Target Membership 최종 설정

| 파일명 | 위치 | ZenApp | ZenActivityWidgetExtension |
|--------|------|--------|---------------------------|
| LiveActivityModule.swift | /ios/ZenApp/ | ✅ | ❌ |
| LiveActivityModule.m | /ios/ZenApp/ | ✅ | ❌ |
| **ZenActivityAttributes.swift** | /ios/ZenActivityWidget/ | ✅ | ✅ |
| ZenActivityWidgetBundle.swift | /ios/ZenActivityWidget/ | ❌ | ✅ |
| ZenActivityWidgetLiveActivity.swift | /ios/ZenActivityWidget/ | ❌ | ✅ |

**핵심**: `ZenActivityAttributes.swift`는 양쪽 타겟 모두에 포함되어야 함!

#### B. NSRangeException 문제 해결

**에러 메시지**:
```
NSRangeException: *** -[__NSArrayM objectAtIndexedSubscript:]: index 4 beyond bounds [0 .. 3]
```

**원인**: JavaScript와 Native Module 간 파라미터 개수 불일치

**해결 방법**: 두 개의 메서드로 분리
1. `updateActivity`: 기존 호환성 유지 (2개 파라미터)
2. `updateActivityWithPause`: 일시정지 지원 (3개 파라미터)

```swift
// LiveActivityModule.swift
@objc
func updateActivity(_ activityId: String,
                   elapsedSeconds: NSNumber,
                   resolver: RCTPromiseResolveBlock,
                   rejecter: RCTPromiseRejectBlock)

@objc  
func updateActivityWithPause(_ activityId: String,
                            elapsedSeconds: NSNumber,
                            isPaused: Bool,
                            resolver: RCTPromiseResolveBlock,
                            rejecter: RCTPromiseRejectBlock)
```

#### C. Live Activity 일시정지 동기화 구현

**수정된 파일들**:
1. `LiveActivityModule.swift`: isPaused 파라미터 처리
2. `LiveActivityModule.m`: 브릿지 시그니처 업데이트
3. `LiveActivityService.ts`: 조건부 메서드 호출
4. `TimerPage.tsx`: 매초마다 상태 업데이트

**동작 흐름**:
```
앱 일시정지 → updateActivityWithPause(isPaused: true) → Live Activity "PAUSED" 표시
앱 재개 → updateActivityWithPause(isPaused: false) → Live Activity 정상 표시
```

#### D. 중복 파일 정리

- `/ios/ZenActivityAttributes.swift` 삭제 (잘못된 위치)
- `/ios/LiveActivityModule.*` → `/ios/ZenApp/`로 이동
- 백업 파일들은 `backup_20250103/` 폴더에 보관

---