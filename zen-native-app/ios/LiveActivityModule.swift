import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  // MARK: - Check if Live Activities are available
  @objc
  func areActivitiesEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      resolve(ActivityAuthorizationInfo().areActivitiesEnabled)
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
            isPaused: false
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
  
 // MARK: - Update Live Activity
  @objc
  func updateActivity(_ activityId: String,
                     elapsedSeconds: NSNumber,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.1, *) {
      Task { @MainActor in  // MainActor 추가
        // Find the activity by ID
        let activities = Activity<ZenActivityAttributes>.activities

        // 디버깅용 로그
        print("Updating activity: \(activityId) with \(elapsedSeconds) seconds")
        print("Active activities count: \(activities.count)")

        guard let activity = activities.first(where: { $0.id == activityId }) else {
          print("Activity not found: \(activityId)")
          print("Available IDs: \(activities.map { $0.id })")
          resolve(false)
          return
        }

        // Update content state
        let updatedState = ZenActivityAttributes.ContentState(
          elapsedSeconds: elapsedSeconds.intValue,
          isPaused: false
        )

        do {
          await activity.update(
            ActivityContent(state: updatedState, staleDate: Date().addingTimeInterval(60))
          )
          print("Successfully updated activity with \(elapsedSeconds) seconds")
        } catch {
          print("Failed to update activity: \(error)")
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