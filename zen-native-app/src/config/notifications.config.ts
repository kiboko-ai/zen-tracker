/**
 * Notification Configuration
 * Central configuration for all notification-related settings
 */

export const NotificationConfig = {
  // Check-in reminder intervals (in minutes)
  CHECK_IN_INTERVALS: {
    SHORT: 30,
    LONG: 60,
  },

  // Minimum session duration to trigger check-in reminders (in seconds)
  MIN_DURATION_FOR_CHECK_IN: 1800, // 30 minutes

  // Notification messages
  MESSAGES: {
    PERMISSION_DENIED: {
      title: 'Notifications Disabled',
      body: 'You have declined push notifications. To receive goal achievement alerts, please enable notifications in Settings.',
    },
    GOAL_ACHIEVED: {
      title: '🎯 Goal Achieved!',
      getBody: (activityName: string, minutes: number) =>
        `Congratulations! You've completed ${minutes} minutes of ${activityName}.`,
    },
    CHECK_IN: {
      title: '⏱️ Still focusing?',
      getBody: (activityName: string, minutes: number) =>
        `You've been working on ${activityName} for ${minutes} minutes. Keep going!`,
    },
    SESSION_COMPLETE: {
      title: '✅ Session Complete',
      getBody: (activityName: string, minutes: number) =>
        `Great job! You've completed ${minutes} minutes of ${activityName}.`,
    },
  },

  // Live Activity configuration (iOS 16.1+)
  LIVE_ACTIVITY: {
    ENABLED: false, // Set to true when native module is implemented
    MIN_IOS_VERSION: 16.1,
    COMING_SOON_MESSAGE: 'Live Activity support coming soon!',
  },

  // Feature flags
  FEATURES: {
    CHECK_IN_REMINDERS: true,
    GOAL_NOTIFICATIONS: true,
    COMPLETION_NOTIFICATIONS: true,
    LIVE_ACTIVITIES: false, // Will be enabled when implemented
  },
};

export default NotificationConfig;