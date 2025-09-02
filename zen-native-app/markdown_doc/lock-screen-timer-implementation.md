# 잠금화면 타이머 구현 가이드

## 개요
잠금화면에서 목표 이름과 타이머를 실시간으로 표시하는 기능 구현 분석 문서

## 현재 프로젝트 구조
```
zen-native-app/
├── src/
│   ├── services/
│   │   └── notifications/
│   │       ├── NotificationService.ts (구현됨)
│   │       └── LiveActivityService.ts (플레이스홀더)
│   ├── hooks/
│   ├── screens/
│   └── store/
├── ios/ (React Native iOS 프로젝트)
└── android/ (React Native Android 프로젝트)
```

## 플랫폼별 구현 방법

### 1. iOS (Live Activity + Dynamic Island)

#### 요구사항
- **최소 iOS 버전**: iOS 16.1+
- **Dynamic Island**: iPhone 14 Pro 이상 (iOS 16.1+)
- **권한**: 알림 권한 불필요 (큰 장점!)

#### 필요한 네이티브 구조
```
ios/
├── ZenActivityWidget/ (새로 생성)
│   ├── ZenActivityWidget.swift
│   ├── ZenActivityAttributes.swift
│   ├── ZenActivityWidget.intentdefinition
│   └── Info.plist
└── ZenApp/
    ├── LiveActivityModule.swift (Native Module)
    └── LiveActivityModule.m (Bridge)
```

#### src 코드 구조
```typescript
// src/native-modules/LiveActivityModule.ts
interface LiveActivityModule {
  startActivity(name: string, target: number): Promise<string>
  updateActivity(id: string, elapsed: number): Promise<void>
  endActivity(id: string): Promise<void>
  areActivitiesEnabled(): Promise<boolean>
}

// src/services/liveActivity/LiveActivityManager.ts
class LiveActivityManager {
  private updateInterval: NodeJS.Timer
  private activityId: string | null
  
  async startTimer(activity: Activity, targetMinutes: number) {
    // ActivityKit 시작
    // 1초마다 업데이트
  }
  
  async updateTimer(elapsedSeconds: number) {
    // Live Activity 콘텐츠 업데이트
  }
  
  async stopTimer() {
    // Live Activity 종료
  }
}
```

#### 구현 단계
1. Xcode에서 Widget Extension 타겟 추가
2. ActivityKit 프레임워크 import
3. Activity Attributes 정의 (타이머 데이터 구조)
4. Native Module 작성 (Swift → React Native 브릿지)
5. Info.plist에 `NSSupportsLiveActivities` = `YES` 추가

### 2. Android (Foreground Service + 확장 알림)

#### 요구사항
- **최소 Android 버전**: Android 5.0 (API 21)
- **권한**: `FOREGROUND_SERVICE` 권한 필요

#### Android 특징
- iOS의 Live Activity 같은 직접적인 잠금화면 위젯 없음
- Foreground Service + 확장 알림으로 유사 구현
- 알림 채널에 실시간 타이머 표시

#### 필요한 네이티브 구조
```
android/app/src/main/java/com/zenapp/
├── services/
│   └── ForegroundTimerService.java
├── modules/
│   └── TimerModule.java
└── notifications/
    └── TimerNotificationManager.java
```

#### src 코드 구조
```typescript
// src/native-modules/ForegroundServiceModule.ts
interface ForegroundServiceModule {
  startService(name: string, target: number): Promise<void>
  updateService(elapsed: number): Promise<void>
  stopService(): Promise<void>
  isServiceRunning(): Promise<boolean>
}

// src/services/foregroundService/ForegroundServiceManager.ts
class ForegroundServiceManager {
  async startTimer(activity: Activity, targetMinutes: number) {
    // Foreground Service 시작
    // RemoteViews로 커스텀 알림 레이아웃
  }
  
  async updateTimer(elapsedSeconds: number) {
    // 알림 콘텐츠 업데이트
  }
  
  async stopTimer() {
    // Service 종료
  }
}
```

#### 구현 단계
1. AndroidManifest.xml에 서비스 등록
2. Foreground Service 구현
3. NotificationCompat.Builder로 확장 알림 생성
4. RemoteViews로 커스텀 레이아웃 (타이머 표시)
5. Native Module 작성 (Java → React Native 브릿지)

### 3. 통합 크로스플랫폼 솔루션

#### 권장 src 폴더 구조
```
src/
├── services/
│   └── lockScreenTimer/
│       ├── LockScreenTimerService.ts (통합 인터페이스)
│       ├── ios/
│       │   └── LiveActivityManager.ts
│       └── android/
│           └── ForegroundServiceManager.ts
├── native-modules/
│   ├── LiveActivityModule.ts (iOS)
│   └── ForegroundServiceModule.ts (Android)
└── hooks/
    └── useLockScreenTimer.ts
```

#### 통합 서비스 인터페이스
```typescript
// src/services/lockScreenTimer/LockScreenTimerService.ts
import { Platform } from 'react-native'

class LockScreenTimerService {
  private platform = Platform.OS
  private manager: LiveActivityManager | ForegroundServiceManager
  
  constructor() {
    if (this.platform === 'ios') {
      this.manager = new LiveActivityManager()
    } else {
      this.manager = new ForegroundServiceManager()
    }
  }
  
  async startLockScreenTimer(activity: string, target: number) {
    if (this.platform === 'ios') {
      // iOS 16.1+ 체크
      if (parseInt(Platform.Version.toString()) >= 16.1) {
        return this.manager.startLiveActivity(activity, target)
      }
    } else {
      return this.manager.startForegroundService(activity, target)
    }
  }
  
  async updateTimer(elapsed: number) {
    return this.manager.updateTimer(elapsed)
  }
  
  async stopTimer() {
    return this.manager.stopTimer()
  }
  
  isSupported(): boolean {
    if (this.platform === 'ios') {
      return parseInt(Platform.Version.toString()) >= 16.1
    }
    return true // Android는 항상 지원
  }
}
```

#### React Hook 인터페이스
```typescript
// src/hooks/useLockScreenTimer.ts
export const useLockScreenTimer = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  
  useEffect(() => {
    setIsSupported(LockScreenTimerService.isSupported())
  }, [])
  
  const startTimer = useCallback(async (activity: string, target: number) => {
    if (!isSupported) return
    
    try {
      await LockScreenTimerService.startLockScreenTimer(activity, target)
      setIsActive(true)
    } catch (error) {
      console.error('Failed to start lock screen timer:', error)
    }
  }, [isSupported])
  
  const stopTimer = useCallback(async () => {
    await LockScreenTimerService.stopTimer()
    setIsActive(false)
  }, [])
  
  return {
    isSupported,
    isActive,
    startTimer,
    stopTimer
  }
}
```

## 구현 우선순위

### Phase 1: iOS Live Activity (2-3일)
1. Widget Extension 타겟 생성
2. ActivityAttributes 구조 정의
3. Native Module 구현
4. LiveActivityService.ts 완성
5. 테스트 (실제 기기 필요)

### Phase 2: Android Foreground Service (2-3일)
1. Foreground Service 클래스 작성
2. 커스텀 알림 레이아웃 디자인
3. Native Module 구현
4. ForegroundServiceManager 완성
5. 테스트

### Phase 3: 통합 및 최적화 (1-2일)
1. LockScreenTimerService 통합 레이어 구현
2. useLockScreenTimer Hook 생성
3. TimerPage.tsx 통합
4. 플랫폼별 테스트

## 이미 준비된 리소스

### 기존 코드 활용 가능 부분
- `LiveActivityService.ts` - 플레이스홀더 구조 있음
- `useNotifications` Hook - 참고 가능한 패턴
- `BackgroundTimer.ts` - 타이머 로직 재사용 가능
- `TimerPage.tsx` - startLiveActivity 호출 로직 있음

### 추가 필요 패키지
```json
{
  "dependencies": {
    // iOS - 추가 패키지 불필요 (네이티브 구현)
    // Android - 추가 패키지 불필요 (네이티브 구현)
  }
}
```

## 주의사항

### iOS
1. **Live Activity는 최대 8시간**까지만 실행 가능
2. Dynamic Island는 iPhone 14 Pro 이상에서만 지원
3. 시뮬레이터에서 Live Activity 테스트 불가 (실제 기기 필요)
4. Widget Extension은 메인 앱과 별도 번들

### Android
1. Android 8.0 (API 26)부터 Foreground Service 제한 강화
2. 배터리 최적화 예외 처리 필요할 수 있음
3. 제조사별 커스터마이징으로 동작 차이 있을 수 있음

## 예상 결과물

### iOS (잠금화면)
```
┌─────────────────────────┐
│  🎯 Study               │
│  15:32 / 30:00         │
│  ████████░░░░░░░       │
└─────────────────────────┘
```

### iOS (Dynamic Island)
```
    ●●●●●●●●●●●●●●●
    Study • 15:32
```

### Android (잠금화면 알림)
```
┌─────────────────────────┐
│ Zen Tracker • 진행 중   │
│ Study                   │
│ 15:32 / 30:00 목표     │
│ [==========>      ] 51% │
└─────────────────────────┘
```

## 테스트 체크리스트

### iOS
- [ ] iOS 16.1 이상 기기에서 Live Activity 표시
- [ ] Dynamic Island 지원 기기에서 표시 확인
- [ ] 백그라운드에서 업데이트 지속
- [ ] 앱 종료 후에도 Live Activity 유지
- [ ] 8시간 제한 처리

### Android
- [ ] Foreground Service 시작/종료
- [ ] 알림 실시간 업데이트
- [ ] 백그라운드 실행 유지
- [ ] 배터리 최적화 제외 확인
- [ ] 다양한 Android 버전 테스트

## 참고 자료

- [Apple ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Android Foreground Service Guide](https://developer.android.com/guide/components/foreground-services)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-intro)