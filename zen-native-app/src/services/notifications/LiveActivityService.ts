import { Platform, NativeModules } from 'react-native';

/**
 * Live Activity Service
 * 
 * Live Activities allow displaying real-time information on the Lock Screen
 * without notification permissions (iOS 16.1+)
 * 
 * Native Module is now connected and ready to use
 */
class LiveActivityService {
  private static instance: LiveActivityService;
  
  private constructor() {}

  public static getInstance(): LiveActivityService {
    if (!LiveActivityService.instance) {
      LiveActivityService.instance = new LiveActivityService();
    }
    return LiveActivityService.instance;
  }

  /**
   * Check if Live Activities are available
   * @returns true if iOS 16.1+ and Live Activities are supported
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'ios' && parseInt(Platform.Version.toString()) >= 16) {
      // Check if native module exists
      if (!NativeModules.LiveActivityModule) {
        console.log('LiveActivityModule not found');
        return false;
      }
      
      try {
        // Check if activities are enabled in settings
        const enabled = await NativeModules.LiveActivityModule.areActivitiesEnabled();
        return enabled;
      } catch (error) {
        console.log('Error checking Live Activity availability:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Start a Live Activity for timer session
   * @param activityName Name of the activity
   * @param targetMinutes Target duration in minutes
   * @returns Activity ID or null if not available
   */
  async startTimerActivity(activityName: string, targetMinutes: number): Promise<string | null> {
    const available = await this.isAvailable();
    if (!available) {
      console.log('Live Activities not available');
      return null;
    }

    try {
      // Start Live Activity via native module
      const activityId = await NativeModules.LiveActivityModule.startActivity(
        activityName,
        targetMinutes
      );
      
      console.log(`Live Activity started with ID: ${activityId}`);
      return activityId;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      return null;
    }
  }

  /**
   * Update an existing Live Activity
   * @param activityId The ID of the activity to update
   * @param elapsedSeconds Current elapsed time in seconds
   * @param isPaused Whether the timer is paused
   */
  async updateActivity(
    activityId: string, 
    elapsedSeconds: number,
    isPaused: boolean = false
  ): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      return;
    }

    try {
      // Debug: Check what's available
      console.log('🔍 LiveActivityModule exists?', !!NativeModules.LiveActivityModule);
      console.log('🔍 Available methods:', Object.keys(NativeModules.LiveActivityModule || {}));
      
      // Use specific pause/resume methods
      if (isPaused === true) {
        console.log('🔴 Calling pauseActivity:', activityId, elapsedSeconds);
        
        // Check if the method exists
        if (NativeModules.LiveActivityModule?.pauseActivity) {
          await NativeModules.LiveActivityModule.pauseActivity(
            activityId,
            elapsedSeconds
          );
        } else {
          console.error('❌ pauseActivity method not found!');
          console.log('Available methods:', Object.keys(NativeModules.LiveActivityModule || {}));
          // Fallback: just don't update
          return;
        }
      } else {
        // Use the original method for normal updates
        console.log('🟢 Calling updateActivity - RUNNING:', activityId, elapsedSeconds);
        await NativeModules.LiveActivityModule.updateActivity(
          activityId,
          elapsedSeconds
        );
      }
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
      console.error('Error stack:', error.stack);
    }
  }

  /**
   * End a Live Activity
   * @param activityId The ID of the activity to end
   */
  async endActivity(activityId: string): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      return;
    }

    try {
      // End Live Activity via native module
      await NativeModules.LiveActivityModule.endActivity(activityId);
      console.log(`Live Activity ended: ${activityId}`);
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }

  /**
   * Get all active Live Activities
   * @returns Array of activity IDs
   * 
   * @todo Implement with native module
   */
  async getActiveActivities(): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    // Coming soon: Get activities via native module
    // Example implementation:
    // return await NativeModules.LiveActivityModule.getActiveActivities();
    
    return [];
  }
}

export default LiveActivityService.getInstance();

/**
 * Native Module Interface (for future implementation)
 * 
 * The native module should implement:
 * 
 * iOS (Swift):
 * ```swift
 * @objc(LiveActivityModule)
 * class LiveActivityModule: NSObject {
 *   @objc
 *   func startActivity(_ config: NSDictionary, 
 *                     resolver: @escaping RCTPromiseResolveBlock,
 *                     rejecter: @escaping RCTPromiseRejectBlock) {
 *     // ActivityKit implementation
 *   }
 * }
 * ```
 * 
 * Bridge Header:
 * ```objc
 * #import <React/RCTBridgeModule.h>
 * @interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)
 * RCT_EXTERN_METHOD(startActivity:(NSDictionary *)config
 *                   resolver:(RCTPromiseResolveBlock)resolve
 *                   rejecter:(RCTPromiseRejectBlock)reject)
 * @end
 * ```
 */