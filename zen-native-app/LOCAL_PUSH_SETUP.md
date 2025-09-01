# 🔔 Zen Tracker 로컬 푸시 알림 설정 가이드

## 가장 쉬운 방법: expo-notifications 사용

### 📦 Step 1: 패키지 설치
```bash
npx expo install expo-notifications
npx expo install expo-device
```

### 📝 Step 2: 기본 NotificationService 생성
```typescript
// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 알림 표시 방식 설정 (앱이 포그라운드에 있을 때도 알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // 1. 권한 요청 (iOS에서 필요)
  async requestPermissions() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      return true;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  }

  // 2. 즉시 알림 보내기
  async sendInstantNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null = 즉시 발송
    });
  }

  // 3. 예약 알림 설정 (몇 초 후)
  async scheduleNotification(title: string, body: string, seconds: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        seconds,
      },
    });
  }

  // 4. 반복 알림 설정
  async scheduleRepeatingNotification(title: string, body: string, seconds: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        seconds,
        repeats: true,
      },
    });
  }

  // 5. 모든 알림 취소
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 6. 특정 알림 취소
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}

export default new NotificationService();
```

### 🎯 Step 3: Zen Tracker에 특화된 알림 기능 추가
```typescript
// src/services/ZenNotificationService.ts
import NotificationService from './NotificationService';

class ZenNotificationService {
  private notificationIds = new Map<string, string>();

  // 목표 달성 알림
  async notifyGoalAchieved(activityName: string, targetMinutes: number) {
    await NotificationService.sendInstantNotification(
      '🎯 목표 달성!',
      `${activityName} ${targetMinutes}분 목표를 달성했습니다! 축하합니다!`,
      { type: 'goal_achieved', activityName }
    );
  }

  // 장시간 사용 체크 알림 (30분마다)
  async startLongSessionReminder(activityName: string, sessionId: string) {
    const id = await NotificationService.scheduleRepeatingNotification(
      '⏱️ 아직 집중 중이신가요?',
      `${activityName}을(를) 시작한 지 시간이 지났습니다. 계속하시겠습니까?`,
      1800 // 30분
    );
    this.notificationIds.set(sessionId, id);
  }

  // 세션 종료시 알림 취소
  async stopLongSessionReminder(sessionId: string) {
    const notificationId = this.notificationIds.get(sessionId);
    if (notificationId) {
      await NotificationService.cancelNotification(notificationId);
      this.notificationIds.delete(sessionId);
    }
  }

  // 일일 리마인더 설정
  async setDailyReminder(hour: number, minute: number) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);
    
    // 오늘 시간이 지났으면 내일로 설정
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const seconds = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
    
    await NotificationService.scheduleNotification(
      '🧘 오늘의 Zen Time',
      '오늘도 집중할 시간입니다. 어떤 활동을 시작하시겠어요?',
      seconds
    );
  }
}

export default new ZenNotificationService();
```

### 🔧 Step 4: TimerPage.tsx에 통합
```typescript
// src/screens/TimerPage.tsx 수정 부분

import ZenNotificationService from '../services/ZenNotificationService';

// handleStart 함수 수정
const handleStart = async () => {
  const targetDuration = targetSeconds > 0 ? targetSeconds * 1000 : undefined;
  startSession(activityId, targetDuration);
  updateActivity(activityId, { lastTargetHours: targetHours, lastTargetMinutes: targetMinutes });
  
  startTimeRef.current = new Date();
  pausedDurationRef.current = 0;
  completionDotAnim.setValue(0);
  setIsRunning(true);
  setShowTargetPicker(false);
  
  // 장시간 사용 알림 시작 (1시간 이상일 때만)
  if (targetSeconds >= 3600) {
    await ZenNotificationService.startLongSessionReminder(
      activity.name,
      currentSession?.id || 'temp'
    );
  }
};

// handleStop 함수 수정
const handleStop = async () => {
  // 알림 취소
  if (currentSession?.id) {
    await ZenNotificationService.stopLongSessionReminder(currentSession.id);
  }
  
  endSession();
  navigation.navigate('Report');
};

// useEffect에 목표 달성 체크 추가
useEffect(() => {
  if (isRunning && !isPaused && seconds >= targetSeconds && targetSeconds > 0) {
    // 목표 달성 알림
    ZenNotificationService.notifyGoalAchieved(
      activity.name,
      Math.floor(targetSeconds / 60)
    );
  }
}, [seconds, targetSeconds, isRunning, isPaused]);
```

### 📱 Step 5: App.tsx에서 권한 요청
```typescript
// App.tsx 수정
import NotificationService from './src/services/NotificationService';

export default function App() {
  // ... 기존 코드

  useEffect(() => {
    // 알림 권한 요청
    NotificationService.requestPermissions();
    checkFirstLaunch();
  }, []);

  // ... 나머지 코드
}
```

### ⚙️ Step 6: app.json 설정 (iOS)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserNotificationUsageDescription": "This app uses notifications to remind you of your focus sessions and goal achievements."
      }
    }
  }
}
```

## 🚀 실행 및 테스트

### 개발 환경에서 테스트
```bash
# iOS (실제 기기 필요)
npx expo run:ios --device

# Android
npx expo run:android
```

### 주의사항
1. **iOS Simulator**: 푸시 알림 테스트 불가 (실제 기기 필요)
2. **Android Emulator**: 로컬 알림은 테스트 가능
3. **권한 거부 처리**: 사용자가 권한을 거부할 경우 대응 로직 필요

## 🎨 추가 커스터마이징 옵션

### 알림 카테고리 설정 (액션 버튼 추가)
```typescript
// iOS에서 알림에 버튼 추가
await Notifications.setNotificationCategoryAsync('session-check', [
  {
    identifier: 'continue',
    buttonTitle: '계속하기',
    options: {
      opensAppToForeground: false,
    },
  },
  {
    identifier: 'stop',
    buttonTitle: '종료하기',
    options: {
      opensAppToForeground: true,
    },
  },
]);
```

### 알림 클릭 핸들링
```typescript
// App.tsx에 추가
useEffect(() => {
  // 알림 클릭 리스너
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { type, activityName } = response.notification.request.content.data;
    
    if (type === 'goal_achieved') {
      // 리포트 페이지로 이동
      navigation.navigate('Report');
    }
  });
  
  return () => subscription.remove();
}, []);
```

## ✅ 장점
1. **설치 간단**: expo-notifications 하나로 해결
2. **크로스 플랫폼**: iOS/Android 동시 지원
3. **Expo 관리**: EAS Build 지원, 업데이트 용이
4. **테스트 쉬움**: Expo Go에서도 부분 테스트 가능

## 🔍 디버깅 팁
```typescript
// 알림 로그 확인
Notifications.addNotificationReceivedListener(notification => {
  console.log('알림 수신:', notification);
});

// 예약된 알림 목록 확인
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('예약된 알림:', scheduled);
```

이 방법이 가장 쉽고 빠르게 구현 가능한 방식입니다!