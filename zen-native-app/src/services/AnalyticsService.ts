import analytics from '@react-native-firebase/analytics'

class AnalyticsService {
  // 스플래시 이벤트
  async logAppOpen() {
    try {
      // console.log('📊 Attempting to log app_open event...')
      await analytics().logEvent('app_open', {
        timestamp: new Date().toISOString(),
      })
      // console.log('✅ GA Event: app_open')
    } catch (error) {
      // console.error('❌ Analytics error:', error)
      // console.error('Error details:', JSON.stringify(error))
    }
  }

  // 온보딩 이벤트
  async logOnboardingEnter() {
    try {
      await analytics().logEvent('onboarding_enter', {
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: onboarding_enter')
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  async logOnboardingSkip() {
    try {
      await analytics().logEvent('onboarding_skip', {
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: onboarding_skip')
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  // Welcome to Zen 페이지 이벤트
  async logWelcomeAddCustomActivity(activityName: string) {
    try {
      await analytics().logEvent('welcome_add_custom_activity', {
        activity_name: activityName,
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: welcome_add_custom_activity', activityName)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  async logWelcomeSelectPresetActivity(activityType: string) {
    try {
      await analytics().logEvent('welcome_select_preset_activity', {
        activity_type: activityType,
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: welcome_select_preset_activity', activityType)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  async logWelcomeContinue(selectedActivities: string[]) {
    try {
      await analytics().logEvent('welcome_continue', {
        selected_count: selectedActivities.length,
        activities: selectedActivities.join(','),
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: welcome_continue', selectedActivities)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  // 메인 화면 이벤트
  async logTimerStart(activityId: string, activityName: string, targetMinutes: number) {
    try {
      await analytics().logEvent('timer_start', {
        activity_id: activityId,
        activity_name: activityName,
        target_minutes: targetMinutes,
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: timer_start', activityName)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  async logTimerStop(activityId: string, activityName: string, durationSeconds: number) {
    try {
      await analytics().logEvent('timer_stop', {
        activity_id: activityId,
        activity_name: activityName,
        duration_seconds: durationSeconds,
        duration_minutes: Math.floor(durationSeconds / 60),
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: timer_stop', activityName, durationSeconds)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  async logReportIconClick() {
    try {
      await analytics().logEvent('report_icon_click', {
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: report_icon_click')
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  // Report 페이지 이벤트
  async logReportPageEnter() {
    try {
      await analytics().logEvent('report_page_enter', {
        timestamp: new Date().toISOString(),
      })
      // console.log('GA Event: report_page_enter')
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  // 화면 이름 설정 (네비게이션 추적용)
  async setCurrentScreen(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      })
      // console.log('GA Screen:', screenName)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }

  // 사용자 속성 설정
  async setUserProperty(name: string, value: string) {
    try {
      await analytics().setUserProperty(name, value)
      // console.log('GA User Property:', name, value)
    } catch (error) {
      // console.error('Analytics error:', error)
    }
  }
}

export default new AnalyticsService()