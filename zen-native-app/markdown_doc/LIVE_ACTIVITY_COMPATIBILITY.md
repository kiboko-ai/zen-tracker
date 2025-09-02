# 🚨 Live Activity & expo-notifications 호환성 분석

## 잠재적 충돌 요소들

### 1. iOS 버전 요구사항 충돌
```yaml
expo-notifications: iOS 10.0+ ✅
Live Activity: iOS 16.1+ ⚠️
Dynamic Island: iOS 16.1+ (iPhone 14 Pro+) ⚠️
```

**문제**: iOS 타겟을 16.1로 올리면 구버전 사용자 이탈
**해결**: 조건부 컴파일로 하위 호환성 유지

### 2. Native Module 충돌 가능성

#### ❌ 문제가 될 수 있는 시나리오
```swift
// expo-notifications가 사용하는 UNUserNotificationCenter
UNUserNotificationCenter.current().delegate = ExpoNotificationsDelegate()

// Live Activity는 ActivityKit 사용 (별도 시스템)
Activity<ZenActivityAttributes>.request(...)
```

#### ✅ 실제로는 문제 없음
- **이유**: 두 시스템이 완전히 분리됨
  - expo-notifications → `UserNotifications` 프레임워크
  - Live Activity → `ActivityKit` 프레임워크
  - 서로 다른 API, 다른 생명주기

### 3. Expo 관리 워크플로우 제한

#### 현재 Expo SDK 51 기준
```json
{
  "expo-notifications": "~0.28.0", // ✅ 지원
  "live-activity": "미지원" // ❌ Native 모듈 필요
}
```

## 🎯 권장 구현 전략

### Option 1: 단계적 마이그레이션 (권장) ✅

```typescript
// Phase 1: expo-notifications만 사용 (현재)
class NotificationService {
  async sendNotification() {
    // expo-notifications 사용
  }
}

// Phase 2: Native Module 추가 (나중)
class EnhancedNotificationService extends NotificationService {
  private liveActivityModule?: NativeModule;
  
  constructor() {
    super();
    // iOS 16.1+ 에서만 Live Activity 모듈 로드
    if (Platform.OS === 'ios' && parseInt(Platform.Version) >= 16) {
      this.liveActivityModule = NativeModules.LiveActivityModule;
    }
  }
  
  async startLiveActivity(data: any) {
    if (this.liveActivityModule) {
      return await this.liveActivityModule.start(data);
    }
    // Fallback: 일반 알림 사용
    return await this.sendNotification();
  }
}
```

### Option 2: Expo Config Plugin 작성

```typescript
// app.json
{
  "expo": {
    "plugins": [
      ["expo-notifications"],
      ["./plugins/withLiveActivity", {
        "deploymentTarget": "16.1"
      }]
    ]
  }
}
```

```javascript
// plugins/withLiveActivity.js
const { withInfoPlist, withXcodeProject } = require('@expo/config-plugins');

module.exports = function withLiveActivity(config, props) {
  // Info.plist에 Live Activity 지원 추가
  config = withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });
  
  // Deployment Target 조건부 설정
  config = withXcodeProject(config, (config) => {
    // iOS 16.1 기능을 조건부로 컴파일
    return config;
  });
  
  return config;
};
```

### Option 3: Development Build 사용

```bash
# EAS Build 설정
eas build:configure

# 커스텀 네이티브 모듈 포함 빌드
eas build --platform ios --profile development
```

## 📦 패키지 버전 관리 전략

### package.json 권장 설정
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-notifications": "~0.28.0",
    "expo-task-manager": "~11.8.0",
    "expo-dev-client": "~4.0.0" // Development build용
  },
  "devDependencies": {
    "@expo/config-plugins": "~8.0.0" // Config plugin 작성용
  }
}
```

### iOS Native 파일 구조
```
ios/
├── ZenApp/
│   ├── Notifications/          # expo-notifications 관련
│   │   └── (Expo가 관리)
│   ├── LiveActivity/           # 커스텀 Live Activity
│   │   ├── LiveActivityModule.swift
│   │   ├── LiveActivityModule.m
│   │   └── ZenActivityWidget.swift
│   └── Info.plist
```

## 🛡️ 안전한 구현 방법

### 1. Feature Flag 사용
```typescript
// src/config/features.ts
export const Features = {
  LIVE_ACTIVITY_ENABLED: Platform.OS === 'ios' && parseInt(Platform.Version) >= 16,
  NOTIFICATIONS_ENABLED: true,
  BACKGROUND_TIMER_ENABLED: true
};

// 사용
if (Features.LIVE_ACTIVITY_ENABLED) {
  await LiveActivityService.start();
} else {
  await NotificationService.sendNotification();
}
```

### 2. 점진적 업그레이드 전략
```typescript
// src/services/NotificationStrategy.ts
interface NotificationStrategy {
  notifyGoalAchieved(activity: string, time: number): Promise<void>;
  startTracking(activity: string): Promise<void>;
  stopTracking(): Promise<void>;
}

class BasicNotificationStrategy implements NotificationStrategy {
  // expo-notifications 사용
}

class LiveActivityStrategy implements NotificationStrategy {
  // Live Activity + expo-notifications 혼합 사용
}

// Factory Pattern
class NotificationFactory {
  static create(): NotificationStrategy {
    if (Features.LIVE_ACTIVITY_ENABLED) {
      return new LiveActivityStrategy();
    }
    return new BasicNotificationStrategy();
  }
}
```

## ✅ 결론: 충돌 없음

### 안심하고 진행 가능한 이유:

1. **API 분리**: `UserNotifications` vs `ActivityKit` - 완전히 다른 시스템
2. **Expo 지원**: expo-notifications는 Native Module과 공존 가능
3. **조건부 로드**: iOS 버전별로 기능 선택적 활성화 가능
4. **Fallback 전략**: Live Activity 미지원 시 일반 알림으로 대체

### 권장 접근법:

```typescript
// 1단계: expo-notifications로 기본 기능 구현 ✅
// 2단계: iOS 타겟 16.1로 업데이트 (조건부) ✅
// 3단계: Live Activity Native Module 추가 ✅
// 4단계: Feature Flag로 점진적 활성화 ✅
```

### 실제 코드 예시:
```typescript
// src/services/UnifiedNotificationService.ts
class UnifiedNotificationService {
  private expo = new ExpoNotificationService();
  private live?: LiveActivityService;
  
  constructor() {
    if (Platform.OS === 'ios' && parseInt(Platform.Version) >= 16) {
      this.live = new LiveActivityService();
    }
  }
  
  async startTimerNotification(activity: string, target: number) {
    // Live Activity 가능하면 사용
    if (this.live?.isAvailable()) {
      await this.live.startTimerActivity(activity, target);
    }
    
    // 항상 로컬 알림도 설정 (백업)
    await this.expo.scheduleGoalNotification(activity, target);
  }
}
```

## 🔧 문제 발생 시 대응책

### 만약 충돌이 발생한다면:

1. **Podfile 수정**:
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Live Activity와 Notification 분리 설정
      if target.name == 'ExpoNotifications'
        config.build_settings['SWIFT_VERSION'] = '5.0'
      end
    end
  end
end
```

2. **Bridge Header 분리**:
```objc
// ZenApp-Bridging-Header.h
#import <ExpoNotifications/ExpoNotifications.h>
// Live Activity는 Swift로만 구현
```

3. **별도 타겟 생성**:
- Main App Target: expo-notifications
- Widget Extension Target: Live Activity

이렇게 하면 완전히 독립적으로 운영 가능합니다.