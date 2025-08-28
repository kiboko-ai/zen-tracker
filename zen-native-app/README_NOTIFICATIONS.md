# 📱 Zen Tracker Notification System

## Overview
Local push notification system for iOS 16+ with clean architecture and permission handling.

## Structure
```
src/
├── services/
│   └── notifications/
│       ├── NotificationService.ts      # Core notification logic
│       └── LiveActivityService.ts      # Live Activity (Coming Soon)
├── hooks/
│   └── useNotifications.ts            # React hook for notifications
└── config/
    └── notifications.config.ts        # Configuration constants
```

## Features

### ✅ Implemented
- **Goal Achievement Notifications**: Alerts when user reaches target time
- **Session Check-in Reminders**: Every 30 minutes for long sessions
- **Session Completion Notifications**: When user ends a session
- **Permission Handling**: Graceful handling with English messages
- **iOS 16+ Support**: Deployment target updated

### 🚧 Coming Soon
- **Live Activities**: Lock screen widgets for real-time timer display (iOS 16.1+)
- **Dynamic Island Support**: For iPhone 14 Pro and later

## Usage

### Basic Implementation
```typescript
import { useNotifications } from '../hooks/useNotifications';

const TimerPage = () => {
  const {
    hasPermission,
    requestPermission,
    scheduleGoalNotification,
    showPermissionDeniedAlert
  } = useNotifications();

  const handleStart = async () => {
    // Request permission on first use
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        showPermissionDeniedAlert();
      }
    }
    
    // Schedule notifications
    await scheduleGoalNotification(activityName, targetMinutes);
  };
};
```

## Permission Flow

1. **First Timer Start**: App requests notification permission
2. **Permission Granted**: All notifications work (foreground & background)
3. **Permission Denied**: Shows message:
   > "You have declined push notifications. To receive goal achievement alerts, please enable notifications in Settings."

## Notification Types

### 1. Goal Achievement
- **Trigger**: When elapsed time >= target time
- **Message**: "🎯 Goal Achieved! Congratulations! You've completed X minutes of [activity]."

### 2. Check-in Reminder
- **Trigger**: Every 30 minutes for sessions >= 30 minutes
- **Message**: "⏱️ Still focusing? You've been working on [activity] for X minutes. Keep going!"

### 3. Session Complete
- **Trigger**: When user stops the timer
- **Message**: "✅ Session Complete. Great job! You've completed X minutes of [activity]."

## Configuration

Edit `src/config/notifications.config.ts` to customize:
- Check-in intervals
- Message templates
- Feature flags

## Testing

### iOS Simulator
- ⚠️ Push notifications don't work in simulator
- Use physical device for testing

### Physical Device
```bash
# Build for device
npx expo run:ios --device

# Or use development build
eas build --platform ios --profile development
```

## Troubleshooting

### Notifications not appearing
1. Check permissions: Settings > Zen Tracker > Notifications
2. Ensure iOS 16+ is installed
3. Check if app is in foreground (notifications still show with our config)

### Permission denied
- User must manually enable in iOS Settings
- App provides link to settings when needed

## Future Enhancements

### Live Activity Implementation (TODO)
When implementing Live Activities:
1. Create Native Module in `ios/ZenApp/LiveActivity/`
2. Add Widget Extension target in Xcode
3. Update `LiveActivityService.ts` with native bridge
4. Set `NSSupportsLiveActivities` to `true` in app.json

### Required Files for Live Activity
```swift
// ios/ZenApp/LiveActivity/LiveActivityModule.swift
@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  // Implementation here
}

// ios/ZenApp/LiveActivity/TimerActivityWidget.swift
struct TimerActivityWidget: Widget {
  // Widget implementation
}
```

## Dependencies
- expo-notifications: ~0.31.4
- expo-device: ^7.1.4
- iOS Deployment Target: 16.0

## Notes
- No in-app alerts when permissions are denied (as requested)
- Notifications work in both foreground and background
- Live Activity doesn't require notification permissions (iOS 16.1+)