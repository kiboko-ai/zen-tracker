import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private hasPermission: boolean = false;
  private notificationListeners: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service and check permissions
   * Does NOT request permission - just checks current status
   */
  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    // Set notification handler for foreground notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status } = await Notifications.getPermissionsAsync();
    this.hasPermission = status === 'granted';
  }

  /**
   * Request notification permissions from the user
   * @returns true if permission granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      this.hasPermission = true;
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: false,
        allowProvisional: false,
      },
    });
    this.hasPermission = status === 'granted';
    
    // Set notification handler for foreground notifications
    if (this.hasPermission) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
    
    return this.hasPermission;
  }

  /**
   * Check if notification permissions are granted
   */
  hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  /**
   * Schedule a goal achievement notification
   * @param activityName Name of the activity
   * @param targetMinutes Target time in minutes
   * @param delaySeconds Optional delay for scheduling
   */
  async scheduleGoalAchievementNotification(
    activityName: string,
    targetMinutes: number,
    delaySeconds?: number
  ): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission');
      return null;
    }

    // Prevent duplicate notifications
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyScheduled = existingNotifications.some(
      notif => notif.content.data?.type === 'goal_achieved' && 
               notif.content.data?.activityName === activityName
    );
    
    if (alreadyScheduled) {
      console.log('Goal notification already scheduled for', activityName);
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zen Tracker',
        body: `You've completed ${targetMinutes} minutes of ${activityName}.`,
        sound: true,
        badge: 1,
        data: { 
          type: 'goal_achieved',
          activityName,
          targetMinutes 
        },
      },
      trigger: delaySeconds ? { seconds: delaySeconds } : null,
    });

    return notificationId;
  }

  /**
   * Schedule a session check-in reminder
   * @param activityName Name of the activity
   * @param intervalMinutes Interval in minutes (30 or 60)
   * @returns Notification ID or null if no permission
   */
  async scheduleSessionCheckInReminder(
    activityName: string,
    intervalMinutes: number = 30
  ): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zen Tracker',
        body: `You've been working on ${activityName} for ${intervalMinutes} minutes.`,
        sound: true,
        data: { 
          type: 'session_check_in',
          activityName,
          intervalMinutes 
        },
      },
      trigger: {
        seconds: intervalMinutes * 60,
        repeats: true,
      },
    });

    return notificationId;
  }

  /**
   * Schedule smart check-in reminders that avoid conflicts with goal/2x notifications
   * 충돌을 회피하는 스마트 체크인 알림 스케줄링
   * @param activityName Name of the activity
   * @param targetSeconds Target time in seconds
   * @returns Array of notification IDs
   */
  async scheduleSmartCheckInReminders(
    activityName: string,
    targetSeconds: number
  ): Promise<string[]> {
    if (!this.hasPermission) {
      console.log('No notification permission for smart check-in');
      return [];
    }

    const notificationIds: string[] = [];
    const doubleTargetSeconds = targetSeconds * 2;
    
    // Calculate conflict times (times when goal or 2x notifications will fire)
    // 충돌 시점 계산 (목표 달성 또는 2x 알림이 발생할 시점)
    const conflictTimes = new Set<number>();
    conflictTimes.add(targetSeconds); // Always skip goal achievement time
    conflictTimes.add(doubleTargetSeconds); // Always skip 2x goal time
    
    // Schedule check-ins at 30-minute intervals, skipping conflict times
    // 30분 간격으로 체크인 알림 스케줄, 충돌 시점은 스킵
    const maxDuration = Math.max(doubleTargetSeconds + 3600, 7200); // Continue for at least 2 hours
    
    for (let checkInTime = 1800; checkInTime <= maxDuration; checkInTime += 1800) {
      // Skip if this time conflicts with goal or 2x notifications
      if (conflictTimes.has(checkInTime)) {
        console.log(`Skipping check-in at ${checkInTime}s to avoid conflict with goal/2x notification`);
        continue;
      }
      
      // Schedule individual check-in notification
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Zen Tracker',
            body: `You've been working on ${activityName} for ${Math.floor(checkInTime / 60)} minutes.`,
            sound: true,
            data: { 
              type: 'session_check_in',
              activityName,
              checkInMinutes: Math.floor(checkInTime / 60),
              scheduledAt: checkInTime
            },
          },
          trigger: {
            seconds: checkInTime,
          },
        });
        
        notificationIds.push(notificationId);
        console.log(`Scheduled check-in at ${checkInTime}s (${Math.floor(checkInTime / 60)}min)`);
      } catch (error) {
        console.error(`Failed to schedule check-in at ${checkInTime}s:`, error);
      }
    }
    
    console.log(`Scheduled ${notificationIds.length} smart check-in reminders for ${activityName}`);
    return notificationIds;
  }

  /**
   * Schedule hourly notifications for infinity mode (no target time)
   * @param activityName Name of the activity
   * @returns Notification ID or null if no permission
   */
  async scheduleHourlyNotification(
    activityName: string
  ): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zen Tracker',
        body: `You've been focusing on ${activityName} for an hour.`,
        sound: true,
        data: { 
          type: 'hourly_check',
          activityName
        },
      },
      trigger: {
        seconds: 3600, // 1 hour
        repeats: true,
      },
    });

    return notificationId;
  }

  /**
   * Schedule a notification at 2x target time
   * @param activityName Name of the activity
   * @param targetMinutes Original target time in minutes
   * @returns Notification ID or null if no permission
   */
  async scheduleDoubleTargetNotification(
    activityName: string,
    targetMinutes: number
  ): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission');
      return null;
    }

    const doubleMinutes = targetMinutes * 2;
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zen Tracker',
        body: `You've been focusing on ${activityName} for ${doubleMinutes} minutes - 2x your goal`,
        sound: true,
        badge: 1,
        data: { 
          type: 'double_target',
          activityName,
          targetMinutes: doubleMinutes
        },
      },
      trigger: {
        seconds: doubleMinutes * 60,
      },
    });

    return notificationId;
  }

  /**
   * Schedule a session completion notification
   * @param activityName Name of the activity
   * @param totalMinutes Total session time in minutes
   */
  async scheduleSessionCompletionNotification(
    activityName: string,
    totalMinutes: number
  ): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Zen Tracker',
        body: `You've completed ${totalMinutes} minutes of ${activityName}.`,
        sound: true,
        badge: 1,
        data: { 
          type: 'session_complete',
          activityName,
          totalMinutes 
        },
      },
      trigger: null, // Immediate notification
    });

    return notificationId;
  }

  /**
   * Schedule a daily reminder notification at 9:00 AM local time
   * 매일 오전 9시에 앱 사용 권유 알림을 설정합니다
   * @returns Notification ID or null if no permission
   * @note This notification repeats daily at 9:00 AM based on device's local time
   * @note If a daily reminder already exists, it will be cancelled and replaced
   */
  async scheduleDailyReminder(): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission for daily reminder');
      return null;
    }

    try {
      // 기존 일일 리마인더 알림 취소 (중복 방지)
      // Cancel existing daily reminders to prevent duplicates
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const existingDailyReminders = existingNotifications.filter(
        notif => notif.content.data?.type === 'daily_reminder'
      );
      
      // 기존 일일 리마인더가 있으면 모두 취소
      for (const reminder of existingDailyReminders) {
        await this.cancelNotification(reminder.identifier);
        console.log('Cancelled existing daily reminder:', reminder.identifier);
      }

      // 매일 오전 9시 알림 스케줄링
      // Schedule notification for 9:00 AM daily
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '◉ Time to Focus',
          body: 'Start your day with a focused session. What will you work on today?',
          sound: true,
          badge: 1,
          data: { 
            type: 'daily_reminder',
            scheduledAt: new Date().toISOString(),
            hour: 9,
            minute: 0
          },
        },
        trigger: {
          hour: 9,      // 오전 9시 (24시간 형식)
          minute: 0,    // 정각
          repeats: true // 매일 반복
        },
      });

      console.log('Daily reminder scheduled successfully:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
      return null;
    }
  }

  /**
   * Cancel the daily reminder notification
   * 일일 리마인더 알림을 취소합니다
   * @returns true if cancelled successfully, false otherwise
   */
  async cancelDailyReminder(): Promise<boolean> {
    try {
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyReminders = existingNotifications.filter(
        notif => notif.content.data?.type === 'daily_reminder'
      );
      
      if (dailyReminders.length === 0) {
        console.log('No daily reminder to cancel');
        return false;
      }

      for (const reminder of dailyReminders) {
        await this.cancelNotification(reminder.identifier);
        console.log('Daily reminder cancelled:', reminder.identifier);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel daily reminder:', error);
      return false;
    }
  }

  /**
   * Check if daily reminder is currently scheduled
   * 일일 리마인더가 현재 스케줄되어 있는지 확인합니다
   * @returns true if daily reminder is scheduled, false otherwise
   */
  async isDailyReminderScheduled(): Promise<boolean> {
    try {
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return existingNotifications.some(
        notif => notif.content.data?.type === 'daily_reminder'
      );
    } catch (error) {
      console.error('Failed to check daily reminder status:', error);
      return false;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param notificationId The ID of the notification to cancel
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Schedule a notification with custom content (for testing)
   * 테스트용 커스텀 알림 스케줄링
   * @param content Notification content object
   * @returns Notification ID or null if no permission
   */
  async scheduleNotificationAsync(options: Notifications.NotificationRequestInput): Promise<string | null> {
    if (!this.hasPermission) {
      console.log('No notification permission for custom notification');
      return null;
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync(options);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule custom notification:', error);
      return null;
    }
  }

  /**
   * Set up notification response listener
   * Called when user interacts with a notification
   */
  setupNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    this.notificationListeners.push(() => subscription.remove());
    return () => subscription.remove();
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.notificationListeners.forEach(unsubscribe => unsubscribe());
    this.notificationListeners = [];
  }
}

export default NotificationService.getInstance();