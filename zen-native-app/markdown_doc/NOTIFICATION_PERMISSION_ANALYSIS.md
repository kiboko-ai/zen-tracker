# 🔔 알림 권한 거부 시 동작 분석

## ❌ 짧은 답변: **불가능**

권한을 거부하면 **모든 알림이 차단됩니다**. 1번이든 2번이든 구분 없이 모두 표시되지 않습니다.

## 📱 플랫폼별 동작

### iOS (엄격함)
```swift
권한 거부 → 모든 알림 차단 (예외 없음)
- 로컬 알림 ❌
- 원격 알림 ❌
- 예약 알림 ❌
- 즉시 알림 ❌
```

### Android (약간의 유연성)
```kotlin
권한 거부 → 시각적 알림 차단
- 알림 표시 ❌
- 소리/진동 ❌
- 하지만 앱 내부 로직은 실행 가능 ⭕
```

## 🎯 대안 전략: 권한 없이도 작동하는 UX

### 1. In-App 알림 시스템 (권한 불필요) ✅

```typescript
// src/services/InAppNotificationService.ts
class InAppNotificationService {
  private timers = new Map<string, NodeJS.Timeout>();
  
  // 30분마다 체크 (앱이 포그라운드에 있을 때)
  startSessionReminder(sessionId: string, callback: () => void) {
    const timer = setInterval(() => {
      // 앱 내에서 Modal이나 Alert 표시
      callback();
    }, 30 * 60 * 1000);
    
    this.timers.set(sessionId, timer);
  }
  
  stopSessionReminder(sessionId: string) {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(sessionId);
    }
  }
}
```

### 2. 하이브리드 접근법 (권장) ⭐

```typescript
// src/services/SmartNotificationService.ts
class SmartNotificationService {
  private hasPermission = false;
  private inAppService = new InAppNotificationService();
  private pushService = new PushNotificationService();
  
  async initialize() {
    // 권한 체크 (요청하지 않음)
    const { status } = await Notifications.getPermissionsAsync();
    this.hasPermission = status === 'granted';
  }
  
  async sendSessionReminder(activity: string, duration: number) {
    if (this.hasPermission) {
      // 권한 있음 → 푸시 알림
      await this.pushService.scheduleNotification(
        '⏱️ 계속 진행 중이신가요?',
        `${activity}을(를) ${duration}분째 진행 중입니다.`
      );
    } else {
      // 권한 없음 → In-App 알림
      this.showInAppReminder(activity, duration);
    }
  }
  
  private showInAppReminder(activity: string, duration: number) {
    // 앱이 포그라운드에 있을 때만 작동
    if (AppState.currentState === 'active') {
      Alert.alert(
        '⏱️ 계속 진행 중이신가요?',
        `${activity}을(를) ${duration}분째 진행 중입니다.`,
        [
          { text: '계속하기', style: 'default' },
          { text: '종료하기', style: 'destructive', onPress: () => this.endSession() }
        ]
      );
    }
  }
}
```

### 3. 커스텀 In-App 알림 UI 컴포넌트

```typescript
// src/components/InAppNotification.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native';

export const InAppNotification = ({ visible, title, message, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      
      // 자동 숨김
      setTimeout(() => {
        onDismiss();
      }, 5000);
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ translateY: slideAnim }] }
    ]}>
      <View style={styles.notification}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismiss}>닫기</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
```

### 4. 권한 요청 전략 개선

```typescript
// src/screens/TimerPage.tsx
const handleStartTimer = async () => {
  const permission = await checkNotificationPermission();
  
  if (!permission) {
    // 권한이 없을 때 설명과 함께 요청
    Alert.alert(
      '알림 권한이 필요합니다',
      '목표 달성 알림과 장시간 사용 알림을 받으시려면 권한을 허용해주세요.\n\n거부하셔도 타이머는 정상 작동합니다.',
      [
        { 
          text: '다음에', 
          style: 'cancel',
          onPress: () => startTimerWithoutNotifications()
        },
        { 
          text: '권한 설정', 
          onPress: async () => {
            const granted = await requestNotificationPermission();
            if (granted) {
              startTimerWithNotifications();
            } else {
              startTimerWithoutNotifications();
            }
          }
        }
      ]
    );
  } else {
    startTimerWithNotifications();
  }
};
```

## 🏗️ 완전한 솔루션 아키텍처

```typescript
// src/services/NotificationManager.ts
class NotificationManager {
  private strategy: NotificationStrategy;
  
  constructor() {
    this.initializeStrategy();
  }
  
  private async initializeStrategy() {
    const hasPermission = await this.checkPermission();
    
    if (hasPermission) {
      this.strategy = new PushNotificationStrategy();
    } else {
      this.strategy = new InAppNotificationStrategy();
    }
  }
  
  // 일일 리마인더 (권한 필요)
  async setDailyReminder(hour: number, minute: number) {
    if (this.strategy instanceof PushNotificationStrategy) {
      return await this.strategy.setDailyReminder(hour, minute);
    }
    // 권한 없으면 설정 불가 안내
    return this.showPermissionRequired('일일 리마인더');
  }
  
  // 세션 리마인더 (권한 없어도 부분 작동)
  async setSessionReminder(activity: string, interval: number) {
    return await this.strategy.setSessionReminder(activity, interval);
  }
  
  private showPermissionRequired(feature: string) {
    Alert.alert(
      '알림 권한 필요',
      `${feature} 기능을 사용하려면 설정에서 알림 권한을 활성화해주세요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '설정으로 이동', onPress: () => Linking.openSettings() }
      ]
    );
  }
}
```

## 📊 권한별 기능 매트릭스

| 기능 | 권한 허용 | 권한 거부 | 대안 |
|------|----------|----------|------|
| 일일 리마인더 | ✅ 푸시 알림 | ❌ 불가 | 앱 실행 시 안내 |
| 목표 달성 알림 | ✅ 푸시 알림 | ⚠️ In-App 알림 | Modal/Toast |
| 30분 체크인 | ✅ 푸시 알림 | ⚠️ In-App 알림 | Alert Dialog |
| 세션 종료 알림 | ✅ 푸시 알림 | ⚠️ In-App 알림 | 화면 내 표시 |

## 💡 UX 권장사항

### 1. 점진적 권한 요청
```typescript
// 처음엔 요청하지 않음
// 사용자가 기능을 사용하려 할 때만 요청

// ❌ 나쁜 예
App.onLaunch() → 즉시 권한 요청

// ✅ 좋은 예  
User.enableReminder() → 기능 설명 → 권한 요청
```

### 2. 권한 거부 시 대체 경험
```typescript
class SessionTracker {
  async notifyProgress() {
    if (hasNotificationPermission) {
      // 완전한 경험
      await sendPushNotification();
      await updateLiveActivity();
      await playSound();
    } else {
      // 제한적이지만 유용한 경험
      await showInAppBanner();
      await updateUIIndicator();
      await saveReminderForNextLaunch();
    }
  }
}
```

### 3. 설정 유도 전략
```typescript
// 특정 횟수 이상 사용 후 권한 재요청
if (sessionCount > 5 && !hasPermission) {
  showSoftPermissionPrompt(
    '알림을 활성화하면 목표 달성과 진행 상황을 놓치지 않을 수 있습니다.',
    onAccept: () => requestPermission(),
    onDecline: () => recordDecline()
  );
}
```

## ✅ 결론

**권한 거부 시 선택적 알림 불가능**하지만, 다음 전략으로 대응 가능:

1. **In-App 알림 시스템 구축** (앱 실행 중에만)
2. **하이브리드 접근** (권한 유무에 따라 다른 전략)
3. **점진적 권한 요청** (필요할 때만)
4. **대체 UX 제공** (권한 없어도 기본 기능 제공)

```typescript
// 최종 권장 구현
const NotificationService = {
  // 항상 작동 (권한 무관)
  inAppReminder: () => { /* Modal/Alert */ },
  
  // 권한 필요
  pushReminder: () => { /* Push Notification */ },
  
  // 스마트 라우팅
  smartReminder: () => {
    return hasPermission ? pushReminder() : inAppReminder();
  }
};
```