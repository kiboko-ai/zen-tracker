  import ActivityKit
  import WidgetKit
  import SwiftUI

  // Activity Attributes 정의
  public struct ZenActivityAttributes: ActivityAttributes {
      public struct ContentState: Codable, Hashable {
          public var elapsedSeconds: Int
          public var isPaused: Bool
          public var lastUpdateTime: Date
          public var pausedDuration: TimeInterval  // 누적된 일시정지 시간

          public init(elapsedSeconds: Int = 0, isPaused: Bool = false, lastUpdateTime: Date = Date(), pausedDuration: TimeInterval = 0) {
              self.elapsedSeconds = elapsedSeconds
              self.isPaused = isPaused
              self.lastUpdateTime = lastUpdateTime
              self.pausedDuration = pausedDuration
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
              // Lock screen UI - 1초마다 업데이트
              LockScreenLiveActivityView(context: context)
                  .activitySystemActionForegroundColor(.white)
                  .activityBackgroundTint(Color.black.opacity(0.5))

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
      
      // 실시간 경과 시간 표시 - 앱에서 받은 elapsedSeconds 사용
      var actualElapsedTime: String {
          // 앱에서 매초 업데이트되는 elapsedSeconds를 그대로 표시
          // isPaused 상태와 무관하게 항상 앱과 동기화된 시간 표시
          return formatTime(seconds: context.state.elapsedSeconds)
      }
      
      // 시간 포맷 함수 - TimerPage.tsx의 formatTimeDisplay와 동일
      func formatTime(seconds: Int) -> String {
          let hours = seconds / 3600
          let minutes = (seconds % 3600) / 60
          let secs = seconds % 60
          
          if hours > 0 {
              return String(format: "%02d:%02d:%02d", hours, minutes, secs)
          } else {
              return String(format: "%02d:%02d", minutes, secs)
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
                  
                  // 일시정지 상태 표시
                  if context.state.isPaused {
                      Image(systemName: "pause.circle.fill")
                          .foregroundColor(.yellow)
                          .font(.title3)
                  }
              }
              
              // 타이머 표시 - 앱에서 매초 업데이트를 받음
              Text(actualElapsedTime)
                  .font(.largeTitle)
                  .fontWeight(.bold)
                  .monospacedDigit()
                  .foregroundColor(context.state.isPaused ? .gray : .white)
              
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