import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import NotificationService from '../services/notifications/NotificationService';
import LiveActivityService from '../services/notifications/LiveActivityService';

interface UseNotificationsReturn {
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  showPermissionDeniedAlert: () => void;
  scheduleGoalNotification: (activityName: string, targetMinutes: number) => Promise<string | null>;
  scheduleCheckInReminder: (activityName: string, intervalMinutes?: number) => Promise<string | null>;
  scheduleCompletionNotification: (activityName: string, totalMinutes: number) => Promise<string | null>;
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
    scheduleCompletionNotification,
    cancelNotification,
    cancelAllNotifications,
    startLiveActivity,
  };
};