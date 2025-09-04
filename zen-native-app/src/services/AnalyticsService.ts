import analytics from '@react-native-firebase/analytics';

export class AnalyticsService {
  static async logEvent(eventName: string, params?: Record<string, any>) {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  static async logScreenView(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('Analytics screen view error:', error);
    }
  }

  static async setUserId(userId: string | null) {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.error('Analytics set user ID error:', error);
    }
  }

  static async setUserProperties(properties: Record<string, string | null>) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, value);
      }
    } catch (error) {
      console.error('Analytics set user properties error:', error);
    }
  }

  static async logSelectContent(contentType: string, itemId: string) {
    try {
      await analytics().logSelectContent({
        content_type: contentType,
        item_id: itemId,
      });
    } catch (error) {
      console.error('Analytics select content error:', error);
    }
  }

  static async logTutorialBegin() {
    try {
      await analytics().logTutorialBegin();
    } catch (error) {
      console.error('Analytics tutorial begin error:', error);
    }
  }

  static async logTutorialComplete() {
    try {
      await analytics().logTutorialComplete();
    } catch (error) {
      console.error('Analytics tutorial complete error:', error);
    }
  }

  static async logAppOpen() {
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.error('Analytics app open error:', error);
    }
  }

  static async logLogin(method: string) {
    try {
      await analytics().logLogin({
        method: method,
      });
    } catch (error) {
      console.error('Analytics login error:', error);
    }
  }

  static async logSignUp(method: string) {
    try {
      await analytics().logSignUp({
        method: method,
      });
    } catch (error) {
      console.error('Analytics sign up error:', error);
    }
  }
}

export const eventNames = {
  // App lifecycle
  APP_OPEN: 'app_open',
  APP_BACKGROUND: 'app_background',
  APP_FOREGROUND: 'app_foreground',
  
  // Timer events
  TIMER_START: 'timer_start',
  TIMER_PAUSE: 'timer_pause',
  TIMER_RESUME: 'timer_resume',
  TIMER_RESET: 'timer_reset',
  TIMER_COMPLETE: 'timer_complete',
  TIMER_TARGET_SET: 'timer_target_set',
  
  // Activity management
  ACTIVITY_CREATE: 'activity_create',
  ACTIVITY_UPDATE: 'activity_update',
  ACTIVITY_DELETE: 'activity_delete',
  ACTIVITY_REORDER: 'activity_reorder',
  ACTIVITY_SELECT: 'activity_select',
  
  // Onboarding
  ONBOARDING_START: 'onboarding_start',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ONBOARDING_SKIP: 'onboarding_skip',
  TUTORIAL_VIEW: 'tutorial_view',
  TUTORIAL_COMPLETE: 'tutorial_complete',
  
  // Notifications
  NOTIFICATION_PERMISSION_GRANTED: 'notification_permission_granted',
  NOTIFICATION_PERMISSION_DENIED: 'notification_permission_denied',
  NOTIFICATION_DAILY_REMINDER_SET: 'notification_daily_reminder_set',
  NOTIFICATION_TIMER_COMPLETE: 'notification_timer_complete',
  
  // Data management
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import',
  DATA_IMPORT_SUCCESS: 'data_import_success',
  DATA_IMPORT_ERROR: 'data_import_error',
  
  // Report/Stats
  REPORT_VIEW: 'report_view',
  REPORT_FILTER_CHANGE: 'report_filter_change',
  STATS_VIEW: 'stats_view',
  
  // Error tracking
  ERROR_OCCURRED: 'error_occurred',
} as const;

export const screenNames = {
  HOME: 'HomePage',
  TIMER: 'TimerPage',
  REPORT: 'ReportPage',
  SETTINGS: 'SettingsPage',
  ONBOARDING: 'OnboardingPage',
} as const;