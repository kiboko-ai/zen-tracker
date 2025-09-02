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
            lastUpdateTime: Date(),
            pausedDuration: 0
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
  
  // MARK: - Update Live Activity (original method - for regular updates)
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
          // 기존 pausedDuration과 isPaused 상태 유지
          let currentPausedDuration = activity.content.state.pausedDuration
          let currentIsPaused = activity.content.state.isPaused
          
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: currentIsPaused,  // 현재 pause 상태 유지
            lastUpdateTime: Date(),
            pausedDuration: currentPausedDuration  // 누적된 pause 시간 유지
          )
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(2),  // 2초 후 stale (일시정지 상태 무관)
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
          var newPausedDuration = activity.content.state.pausedDuration
          
          // 일시정지 -> 재개: 일시정지된 시간을 누적
          if !isPaused && activity.content.state.isPaused {
              let pauseTime = Date().timeIntervalSince(activity.content.state.lastUpdateTime)
              newPausedDuration += pauseTime
              print("Resuming: Adding \(pauseTime) seconds to pausedDuration")
          }
          
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: isPaused,
            lastUpdateTime: Date(),
            pausedDuration: newPausedDuration
          )
          
          print("Updating activity - isPaused: \(isPaused), pausedDuration: \(newPausedDuration)")
          
          let content = ActivityContent(
            state: updatedState,
            staleDate: Date().addingTimeInterval(2),  // 2초 후 stale (항상 업데이트)
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
          // 일시정지 시작 - pausedDuration은 변경 안함
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: true,
            lastUpdateTime: Date(),
            pausedDuration: activity.content.state.pausedDuration
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
          // 재개 시 - 일시정지 시간 누적
          let pausedTime = Date().timeIntervalSince(activity.content.state.lastUpdateTime)
          let newPausedDuration = activity.content.state.pausedDuration + pausedTime
          
          let updatedState = ZenActivityAttributes.ContentState(
            elapsedSeconds: elapsedSeconds.intValue,
            isPaused: false,
            lastUpdateTime: Date(),
            pausedDuration: newPausedDuration
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