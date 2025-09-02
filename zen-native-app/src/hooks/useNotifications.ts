import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import NotificationService from '../services/notifications/NotificationService';
import LiveActivityService from '../services/notifications/LiveActivityService';

interface UseNotificationsReturn {
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  showPermissionDeniedAlert: () => void;
  scheduleGoalNotification: (activityName: string, targetMinutes: number, delaySeconds?: number) => Promise<string | null>;
  scheduleCheckInReminder: (activityName: string, intervalMinutes?: number) => Promise<string | null>;
  scheduleSmartCheckInReminders: (activityName: string, targetSeconds: number) => Promise<string[]>;
  scheduleCompletionNotification: (activityName: string, totalMinutes: number) => Promise<string | null>;
  scheduleHourlyNotification: (activityName: string) => Promise<string | null>;
  scheduleDoubleTargetNotification: (activityName: string, targetMinutes: number) => Promise<string | null>;
  scheduleDailyReminder: () => Promise<string | null>;
  cancelDailyReminder: () => Promise<boolean>;
  isDailyReminderScheduled: () => Promise<boolean>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  startLiveActivity: (activityName: string, targetMinutes: number) => Promise<string | null>;
}

/**
 * Custom hook for managing notifications
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      setHasPermission(NotificationService.hasNotificationPermission());
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await NotificationService.requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const showPermissionDeniedAlert = useCallback(() => {
    Alert.alert(
      'Notifications Disabled',
      'You have declined push notifications. To receive goal achievement alerts, please enable notifications in Settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }, []);

  const scheduleGoalNotification = useCallback(
    async (activityName: string, targetMinutes: number, delaySeconds?: number): Promise<string | null> => {
      if (!hasPermission) {
        showPermissionDeniedAlert();
        return null;
      }
      return await NotificationService.scheduleGoalAchievementNotification(
        activityName,
        targetMinutes,
        delaySeconds
      );
    },
    [hasPermission, showPermissionDeniedAlert]
  );

  const scheduleCheckInReminder = useCallback(
    async (activityName: string, intervalMinutes: number = 30): Promise<string | null> => {
      if (!hasPermission) {
        console.log('No permission for check-in reminders');
        return null;
      }
      return await NotificationService.scheduleSessionCheckInReminder(
        activityName,
        intervalMinutes
      );
    },
    [hasPermission]
  );

  const scheduleSmartCheckInReminders = useCallback(
    async (activityName: string, targetSeconds: number): Promise<string[]> => {
      if (!hasPermission) {
        console.log('No permission for smart check-in reminders');
        return [];
      }
      return await NotificationService.scheduleSmartCheckInReminders(
        activityName,
        targetSeconds
      );
    },
    [hasPermission]
  );

  const scheduleCompletionNotification = useCallback(
    async (activityName: string, totalMinutes: number): Promise<string | null> => {
      if (!hasPermission) {
        console.log('No permission for completion notifications');
        return null;
      }
      return await NotificationService.scheduleSessionCompletionNotification(
        activityName,
        totalMinutes
      );
    },
    [hasPermission]
  );

  const scheduleHourlyNotification = useCallback(
    async (activityName: string): Promise<string | null> => {
      if (!hasPermission) {
        console.log('No permission for hourly notifications');
        return null;
      }
      return await NotificationService.scheduleHourlyNotification(activityName);
    },
    [hasPermission]
  );

  const scheduleDoubleTargetNotification = useCallback(
    async (activityName: string, targetMinutes: number): Promise<string | null> => {
      if (!hasPermission) {
        console.log('No permission for double target notifications');
        return null;
      }
      return await NotificationService.scheduleDoubleTargetNotification(
        activityName,
        targetMinutes
      );
    },
    [hasPermission]
  );

  /**
   * Schedule daily reminder at 9:00 AM
   * 매일 오전 9시에 앱 사용 권유 알림을 설정합니다
   * @returns Notification ID or null if no permission
   */
  const scheduleDailyReminder = useCallback(
    async (): Promise<string | null> => {
      if (!hasPermission) {
        console.log('No permission for daily reminder');
        // Daily reminder 는 중요하지 않으므로 alert 표시하지 않음
        // Don't show alert for daily reminder as it's not critical
        return null;
      }
      return await NotificationService.scheduleDailyReminder();
    },
    [hasPermission]
  );

  /**
   * Cancel the daily reminder notification
   * 일일 리마인더 알림을 취소합니다
   * @returns true if cancelled successfully
   */
  const cancelDailyReminder = useCallback(async (): Promise<boolean> => {
    return await NotificationService.cancelDailyReminder();
  }, []);

  /**
   * Check if daily reminder is scheduled
   * 일일 리마인더가 스케줄되어 있는지 확인합니다
   * @returns true if scheduled
   */
  const isDailyReminderScheduled = useCallback(async (): Promise<boolean> => {
    return await NotificationService.isDailyReminderScheduled();
  }, []);

  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    await NotificationService.cancelNotification(notificationId);
  }, []);

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    await NotificationService.cancelAllNotifications();
  }, []);

  const startLiveActivity = useCallback(
    async (activityName: string, targetMinutes: number): Promise<string | null> => {
      // Try Live Activity first (no permission needed)
      const activityId = await LiveActivityService.startTimerActivity(activityName, targetMinutes);
      
      if (!activityId && !hasPermission) {
        // If Live Activity not available and no notification permission
        showPermissionDeniedAlert();
      }
      
      return activityId;
    },
    [hasPermission, showPermissionDeniedAlert]
  );

  return {
    hasPermission,
    isLoading,
    requestPermission,
    showPermissionDeniedAlert,
    scheduleGoalNotification,
    scheduleCheckInReminder,
    scheduleSmartCheckInReminders,  // 스마트 체크인 리마인더 추가
    scheduleCompletionNotification,
    scheduleHourlyNotification,
    scheduleDoubleTargetNotification,
    scheduleDailyReminder,        // 일일 리마인더 스케줄링
    cancelDailyReminder,          // 일일 리마인더 취소
    isDailyReminderScheduled,     // 일일 리마인더 상태 확인
    cancelNotification,
    cancelAllNotifications,
    startLiveActivity,
  };
};