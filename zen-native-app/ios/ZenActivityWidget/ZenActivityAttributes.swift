import ActivityKit
import Foundation

// This file is shared between the main app and the widget extension
public struct ZenActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic content that updates during the activity
        public var elapsedSeconds: Int
        public var isPaused: Bool
        public var lastUpdateTime: Date       // For real-time sync
        public var pausedDuration: TimeInterval  // Accumulated pause time
        
        public init(elapsedSeconds: Int = 0, isPaused: Bool = false, lastUpdateTime: Date = Date(), pausedDuration: TimeInterval = 0) {
            self.elapsedSeconds = elapsedSeconds
            self.isPaused = isPaused
            self.lastUpdateTime = lastUpdateTime
            self.pausedDuration = pausedDuration
        }
    }
    
    // Static content that doesn't change during the activity
    public var activityName: String
    public var targetSeconds: Int
    public var startTime: Date
    
    public init(activityName: String, targetSeconds: Int, startTime: Date = Date()) {
        self.activityName = activityName
        self.targetSeconds = targetSeconds
        self.startTime = startTime
    }
}