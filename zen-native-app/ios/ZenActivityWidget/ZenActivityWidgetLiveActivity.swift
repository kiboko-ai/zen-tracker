//
//  ZenActivityWidgetLiveActivity.swift
//  ZenActivityWidget
//
//  Created by michael on 9/2/25.
//  Modified on 1/3/25 - Improved pause synchronization
//

import ActivityKit
import WidgetKit
import SwiftUI

// Live Activity Widget Configuration
struct ZenActivityWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ZenActivityAttributes.self) { context in
            // Lock screen/banner UI
            LockScreenLiveActivityView(context: context)
                .activitySystemActionForegroundColor(.white)
                .activityBackgroundTint(Color.black.opacity(0.5))
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: "timer")
                            .foregroundColor(.orange)
                        Text(context.attributes.activityName)
                            .font(.caption)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isPaused {
                        Text(formatTime(seconds: context.state.elapsedSeconds))
                            .font(.caption)
                            .foregroundColor(.gray)
                    } else {
                        let adjustedStart = context.attributes.startTime.addingTimeInterval(context.state.pausedDuration)
                        Text(adjustedStart, style: .timer)
                            .font(.caption)
                            .monospacedDigit()
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    if context.state.isPaused {
                        Text("PAUSED")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.attributes.targetSeconds > 0 {
                        DynamicIslandProgressView(context: context)
                    }
                }
            } compactLeading: {
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "timer.circle.fill")
                    .foregroundColor(.orange)
            } compactTrailing: {
                if context.state.isPaused {
                    Text(formatTimeCompact(seconds: context.state.elapsedSeconds))
                        .foregroundColor(.gray)
                } else {
                    let adjustedStart = context.attributes.startTime.addingTimeInterval(context.state.pausedDuration)
                    Text(adjustedStart, style: .timer)
                        .monospacedDigit()
                        .foregroundColor(.white)
                }
            } minimal: {
                Image(systemName: "timer")
                    .foregroundColor(.orange)
            }
            .widgetURL(URL(string: "zentracker://timer"))
            .keylineTint(.orange)
        }
    }
}

// Lock Screen View
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<ZenActivityAttributes>
    
    // Real-time elapsed seconds calculation (like FitiRun)
    private var actualElapsedSeconds: Int {
        if context.state.isPaused {
            return context.state.elapsedSeconds
        } else {
            let elapsed = Date().timeIntervalSince(context.attributes.startTime) - context.state.pausedDuration
            return max(0, Int(elapsed))
        }
    }
    
    init(context: ActivityViewContext<ZenActivityAttributes>) {
        self.context = context
        print("🎯 Widget Update - isPaused: \(context.state.isPaused), elapsed: \(context.state.elapsedSeconds), pausedDuration: \(context.state.pausedDuration)")
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "timer.circle.fill")
                    .foregroundColor(.orange)
                    .font(.system(size: 20))
                
                Text(context.attributes.activityName)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if context.state.isPaused {
                    Text("PAUSED")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.3))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                }
            }
            
            // Timer Display using TimeText for real-time updates
            HStack {
                Spacer()
                
                if context.state.isPaused {
                    // When paused, show static time
                    Text(formatTime(seconds: context.state.elapsedSeconds))
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .foregroundColor(.gray)
                } else {
                    // When running, use timer style for real-time updates
                    // Adjust start time by subtracting paused duration
                    let adjustedStart = context.attributes.startTime.addingTimeInterval(context.state.pausedDuration)
                    Text(adjustedStart, style: .timer)
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                
                Spacer()
            }
            
            // Progress Bar with real-time updates
            if context.attributes.targetSeconds > 0 {
                ProgressBarView(context: context)
            } else {
                // Infinity mode
                HStack {
                    Image(systemName: "infinity")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("No target set")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
        .padding()
    }
}



// MARK: - Dynamic Island Progress View
struct DynamicIslandProgressView: View {
    let context: ActivityViewContext<ZenActivityAttributes>
    
    var progress: Double {
        if context.state.isPaused {
            return Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds)
        } else {
            let elapsed = Date().timeIntervalSince(context.attributes.startTime) - context.state.pausedDuration
            return min(1.0, elapsed / Double(context.attributes.targetSeconds))
        }
    }
    
    var body: some View {
        ProgressView(value: progress)
            .tint(.orange)
    }
}

// MARK: - Progress Component with Real-time updates
struct ProgressBarView: View {
    let context: ActivityViewContext<ZenActivityAttributes>
    
    var progress: Double {
        if context.state.isPaused {
            return Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds)
        } else {
            let elapsed = Date().timeIntervalSince(context.attributes.startTime) - context.state.pausedDuration
            return min(1.0, elapsed / Double(context.attributes.targetSeconds))
        }
    }
    
    var progressPercent: Int {
        min(100, Int(progress * 100))
    }
    
    var body: some View {
        VStack(spacing: 6) {
            ProgressView(value: progress)
                .tint(.orange)
                .scaleEffect(y: 1.5)
            
            HStack {
                Text("Target: \(formatTime(seconds: context.attributes.targetSeconds))")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Spacer()
                
                Text("\(progressPercent)%")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
    }
}

// Helper Functions
private func formatTime(seconds: Int) -> String {
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    let secs = seconds % 60
    
    if hours > 0 {
        return String(format: "%02d:%02d:%02d", hours, minutes, secs)
    } else {
        return String(format: "%02d:%02d", minutes, secs)
    }
}

private func formatTimeCompact(seconds: Int) -> String {
    let minutes = seconds / 60
    if minutes < 60 {
        return "\(minutes)m"
    } else {
        let hours = minutes / 60
        let mins = minutes % 60
        return "\(hours)h\(mins)m"
    }
}

// Preview Provider
@available(iOS 16.2, *)
struct ZenActivityWidgetLiveActivity_Previews: PreviewProvider {
    static let attributes = ZenActivityAttributes(
        activityName: "Reading",
        targetSeconds: 1800,
        startTime: Date()
    )
    
    static let contentState = ZenActivityAttributes.ContentState(
        elapsedSeconds: 600,
        isPaused: false,
        lastUpdateTime: Date(),
        pausedDuration: 0
    )
    
    static var previews: some View {
        attributes
            .previewContext(contentState, viewKind: .content)
            .previewDisplayName("Lock Screen")
        
        attributes
            .previewContext(contentState, viewKind: .dynamicIsland(.compact))
            .previewDisplayName("Compact")
        
        attributes
            .previewContext(contentState, viewKind: .dynamicIsland(.expanded))
            .previewDisplayName("Expanded")
    }
}