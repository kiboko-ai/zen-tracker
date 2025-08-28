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
        title: '🎯 Goal Achieved!',
        body: `Congratulations! You've completed ${targetMinutes} minutes of ${activityName}.`,
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
        title: '⏱️ Still focusing?',
        body: `You've been working on ${activityName} for ${intervalMinutes} minutes. Keep going!`,
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
        title: '⏱️ One hour passed',
        body: `You've been focusing on ${activityName} for an hour. Great persistence!`,
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
        title: '🔥 Double your target!',
        body: `Amazing! You've been focusing on ${activityName} for ${doubleMinutes} minutes - that's 2x your goal!`,
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
        title: '✅ Session Complete',
        body: `Great job! You've completed ${totalMinutes} minutes of ${activityName}.`,
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