  import ActivityKit
  import WidgetKit
  import SwiftUI

  // Activity Attributes 정의
  public struct ZenActivityAttributes: ActivityAttributes {
      public struct ContentState: Codable, Hashable {
          public var elapsedSeconds: Int
          public var isPaused: Bool
          public var pausedAt: Date?

          public init(elapsedSeconds: Int = 0, isPaused: Bool = false, pausedAt: Date? = nil) {
              self.elapsedSeconds = elapsedSeconds
              self.isPaused = isPaused
              self.pausedAt = pausedAt
          }
      }

      public var activityName: String
      public var targetSeconds: Int
      public var startTime: Date

      public init(activityName: String, targetSeconds: Int, startTime: Date = Date()) {
          self.activityName = activityName
          self.targetSeconds = targetSeconds
          self.startTime = startTime
      }
  }

  // Live Activity Widget
  struct ZenActivityWidgetLiveActivity: Widget {
      var body: some WidgetConfiguration {
          ActivityConfiguration(for: ZenActivityAttributes.self) { context in
              // Lock screen UI - 자동 업데이트 타이머 사용
              LockScreenLiveActivityView(context: context)

          } dynamicIsland: { context in
              DynamicIsland {
                  DynamicIslandExpandedRegion(.center) {
                      Text(context.attributes.activityName)
                  }
              } compactLeading: {
                  Image(systemName: "timer")
              } compactTrailing: {
                  Text("\(context.state.elapsedSeconds / 60)m")
              } minimal: {
                  Image(systemName: "timer")
              }
          }
      }
  }
  
  // Lock Screen View 분리
  struct LockScreenLiveActivityView: View {
      let context: ActivityViewContext<ZenActivityAttributes>
      
      // 시간 포맷 함수
      func formatTime(seconds: Int) -> String {
          let hours = seconds / 3600
          let minutes = (seconds % 3600) / 60
          let secs = seconds % 60
          
          if hours > 0 {
              return String(format: "%d:%02d:%02d", hours, minutes, secs)
          } else {
              return String(format: "%d:%02d", minutes, secs)
          }
      }
      
      var body: some View {
          VStack(spacing: 12) {
              // Header
              HStack {
                  Image(systemName: "timer")
                      .foregroundColor(.orange)
                  Text(context.attributes.activityName)
                      .font(.headline)
                  Spacer()
              }
              
              // 🔴 핵심: elapsedSeconds부터 시작하는 타이머
              // 매초 업데이트되는 elapsedSeconds를 기준으로 타이머 표시
              let adjustedStartTime = Date().addingTimeInterval(-Double(context.state.elapsedSeconds))
              let endDate = adjustedStartTime.addingTimeInterval(28800) // 8시간
              Text(timerInterval: adjustedStartTime...endDate, countsDown: false)
                  .font(.largeTitle)
                  .fontWeight(.bold)
                  .monospacedDigit()
                  .foregroundColor(.white)
              
              // Progress Bar
              if context.attributes.targetSeconds > 0 {
                  let progress = min(Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds), 1.0)
                  
                  ProgressView(value: progress)
                      .tint(.orange)
                  
                  HStack {
                      Text("목표: \(context.attributes.targetSeconds / 60)분")
                          .font(.caption)
                          .foregroundColor(.gray)
                      Spacer()
                      Text("\(Int(progress * 100))%")
                          .font(.caption)
                          .foregroundColor(.orange)
                  }
              }
          }
          .padding()
      }
  }