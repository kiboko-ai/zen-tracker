#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

// Check if Live Activities are enabled
RCT_EXTERN_METHOD(areActivitiesEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Start a new Live Activity
RCT_EXTERN_METHOD(startActivity:(NSString *)activityName
                  targetMinutes:(nonnull NSNumber *)targetMinutes
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Update an existing Live Activity
RCT_EXTERN_METHOD(updateActivity:(NSString *)activityId
                  elapsedSeconds:(nonnull NSNumber *)elapsedSeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Update Live Activity with pause state
RCT_EXTERN_METHOD(updateActivityWithPause:(NSString *)activityId
                  elapsedSeconds:(nonnull NSNumber *)elapsedSeconds
                  isPaused:(BOOL)isPaused
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Pause a Live Activity
RCT_EXTERN_METHOD(pauseActivity:(NSString *)activityId
                  elapsedSeconds:(nonnull NSNumber *)elapsedSeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Resume a Live Activity
RCT_EXTERN_METHOD(resumeActivity:(NSString *)activityId
                  elapsedSeconds:(nonnull NSNumber *)elapsedSeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// End a Live Activity
RCT_EXTERN_METHOD(endActivity:(NSString *)activityId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get all active Live Activities
RCT_EXTERN_METHOD(getActiveActivities:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end