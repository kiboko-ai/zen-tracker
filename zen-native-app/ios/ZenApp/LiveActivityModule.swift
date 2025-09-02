import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  // MARK: - Check if Live Activities are available
  @objc
  func areActivitiesEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.2, *) {
      // Check current status
      let authInfo = ActivityAuthorizationInfo()
      print("Live Activities enabled: \(authInfo.areActivitiesEnabled)")
      print("Frequent pushes enabled: \(authInfo.frequentPushesEnabled)")
      resolve(authInfo.areActivitiesEnabled)
    } else if #available(iOS 16.1, *) {
      // For iOS 16.1
      resolve(true) // Assume enabled
    } else {
      resolve(false)
    }
  }
  
  // MARK: - Start Live Activity
  @objc
  func startActivity(_ activityName: String,
                    targetMinutes: NSNumber,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task {
        do {
          // Create activity attributes
          let attributes = ZenActivityAttributes(
            activityName: activityName,
            targetSeconds: targetMinutes.intValue * 60,
            startTime: Date()
          )
          
          // Initial content state
          let initialState = ZenActivityAttributes.ContentState(
            elapsedSeconds: 0,
            isPaused: false,
            pausedAt: nil
          )
          
          // Start the Live Activity
          let activity = try Activity<ZenActivityAttributes>.request(
            attributes: attributes,
            content: .init(state: initialState, staleDate: nil),
            pushType: nil
          )
          
          print("Live Activity started with ID: \(activity.id)")
          resolve(activity.id)
          
        } catch {
          print("Error starting Live Activity: \(error)")
          reject("ACTIVITY_ERROR", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Update Live Activity (original method)
  // Store pause state globally for the module
  private var currentPauseState: Bool = false
  
  @objc
  func updateActivity(_ activityId: String,
                     elapsedSeconds: NSNumber,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task { @MainActor in
        // Find all active activities
        let activities = Activity<ZenActivityAttributes>.activities
        
        // Update all activities (in case ID doesn't match exactly)
        for activity in activities {
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: false,
            pausedAt: nil
          )
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(60),
            relevanceScore: 100
          )
          
          await activity.update(content)
        }
        
        resolve(true)
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Update Live Activity with pause state
  @objc
  func updateActivityWithPause(_ activityId: String,
                               elapsedSeconds: NSNumber,
                               isPaused: Bool,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task { @MainActor in
        print("🔴 updateActivityWithPause called - isPaused: \(isPaused), elapsed: \(elapsedSeconds)")
        
        // Find all active activities
        let activities = Activity<ZenActivityAttributes>.activities
        print("Found \(activities.count) active activities")
        
        // Update all activities (in case ID doesn't match exactly)
        for activity in activities {
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: isPaused,
            pausedAt: isPaused ? Date() : nil
          )
          
          print("Updating activity with paused state: \(isPaused)")
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: isPaused ? nil : Date().addingTimeInterval(60),
            relevanceScore: 100
          )
          
          await activity.update(content)
          print("Activity updated successfully with pause state: \(isPaused)")
        }
        
        resolve(true)
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Pause Live Activity
  @objc
  func pauseActivity(_ activityId: String,
                     elapsedSeconds: NSNumber,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task { @MainActor in
        print("⏸️ pauseActivity called with elapsed: \(elapsedSeconds)")
        
        let activities = Activity<ZenActivityAttributes>.activities
        for activity in activities {
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: true,
            pausedAt: Date()
          )
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: nil,  // No stale date when paused
            relevanceScore: 100
          )
          
          await activity.update(content)
          print("⏸️ Activity paused successfully")
        }
        
        resolve(true)
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Resume Live Activity
  @objc
  func resumeActivity(_ activityId: String,
                      elapsedSeconds: NSNumber,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task { @MainActor in
        print("▶️ resumeActivity called with elapsed: \(elapsedSeconds)")
        
        let activities = Activity<ZenActivityAttributes>.activities
        for activity in activities {
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: false,
            pausedAt: nil
          )
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(60),
            relevanceScore: 100
          )
          
          await activity.update(content)
          print("▶️ Activity resumed successfully")
        }
        
        resolve(true)
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - End Live Activity
  @objc
  func endActivity(_ activityId: String,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task {
        // Find the activity by ID
        let activities = Activity<ZenActivityAttributes>.activities
        guard let activity = activities.first(where: { $0.id == activityId }) else {
          print("Activity not found: \(activityId)")
          resolve(false)
          return
        }
        
        // End the activity
        await activity.end(nil, dismissalPolicy: .immediate)
        print("Live Activity ended: \(activityId)")
        resolve(true)
      }
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Get all active activities
  @objc
  func getActiveActivities(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      // TODO: Implement after Widget Extension is created
      resolve([])
    } else {
      reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
    }
  }
  
  // MARK: - Required for React Native
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}