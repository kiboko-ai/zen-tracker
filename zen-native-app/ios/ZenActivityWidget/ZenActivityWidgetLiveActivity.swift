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
                    Text(formatTime(seconds: context.state.elapsedSeconds))
                        .font(.caption)
                        .foregroundColor(context.state.isPaused ? .gray : .white)
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
                        ProgressView(value: Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds))
                            .tint(.orange)
                    }
                }
            } compactLeading: {
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "timer")
                    .foregroundColor(.orange)
            } compactTrailing: {
                Text(formatTimeCompact(seconds: context.state.elapsedSeconds))
                    .foregroundColor(context.state.isPaused ? .gray : .white)
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
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "timer")
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
            
            // Timer Display
            HStack {
                Spacer()
                
                if context.state.isPaused {
                    // 일시정지 상태: 고정된 시간 표시
                    Text(formatTime(seconds: context.state.elapsedSeconds))
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .foregroundColor(.gray)
                } else {
                    // 실행 중: 실시간 업데이트 타이머
                    // 서버에서 보낸 elapsedSeconds 사용
                    Text(formatTime(seconds: context.state.elapsedSeconds))
                        .font(.system(size: 42, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                
                Spacer()
            }
            
            // Progress Bar (if target is set)
            if context.attributes.targetSeconds > 0 {
                VStack(spacing: 6) {
                    ProgressView(value: min(1.0, Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds)))
                        .tint(.orange)
                        .scaleEffect(y: 1.5)
                    
                    HStack {
                        Text("Target: \(formatTime(seconds: context.attributes.targetSeconds))")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Spacer()
                        
                        let progress = min(100, Int((Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds)) * 100))
                        Text("\(progress)%")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
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
        isPaused: false
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