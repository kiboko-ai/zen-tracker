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
              
              // 타이머 표시 - pausedDuration을 활용한 정확한 계산
              Group {
                  if context.state.isPaused {
                      // 일시정지: 현재 값 고정 표시
                      Text(formatTime(seconds: context.state.elapsedSeconds))
                          .font(.largeTitle)
                          .fontWeight(.bold)
                          .monospacedDigit()
                          .foregroundColor(.gray)
                  } else {
                      // 실행 중: 시작 시간과 pausedDuration을 사용한 자동 업데이트
                      // startTime + pausedDuration을 더해서 실제 타이머 시작점 계산
                      let adjustedStart = context.attributes.startTime.addingTimeInterval(context.state.pausedDuration)
                      Text(timerInterval: adjustedStart...adjustedStart.addingTimeInterval(28800), countsDown: false)
                          .font(.largeTitle)
                          .fontWeight(.bold)
                          .monospacedDigit()
                          .foregroundColor(.white)
                  }
              }
              
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