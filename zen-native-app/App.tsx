import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HomePage from './src/screens/HomePage'
import TimerPage from './src/screens/TimerPage'
import ReportPage from './src/screens/ReportPage'
import OnboardingPage from './src/screens/OnboardingPage'
import { OnboardingTutorial } from './src/components/OnboardingTutorial'
import { useStore } from './src/store/store'
import NotificationService from './src/services/notifications/NotificationService'
import AnalyticsService from './src/services/AnalyticsService'

export type RootStackParamList = {
  Onboarding: undefined
  Home: undefined
  Timer: { id: string }
  Report: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function App() {
  const isFirstTime = useStore(state => state.isFirstTime)
  const activities = useStore(state => state.activities)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // If there are existing activities, skip onboarding regardless of isFirstTime flag
  const shouldShowOnboarding = isFirstTime && activities.length === 0

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // console.log('🚀 App initializing...')
      // Log app open event
      await AnalyticsService.logAppOpen()
      // console.log('✅ GA initialized successfully')
      
      // Initialize notification service
      await NotificationService.initialize()
      
      // TEST MODE: 30분마다 알림 (테스트용)
      // Uncomment the following block to enable test notifications every 30 minutes
      const TEST_MODE = false; // 테스트 모드 활성화/비활성화
      
      const hasPermission = NotificationService.hasNotificationPermission()
      if (hasPermission) {
        if (TEST_MODE) {
          // 테스트 모드: 30분마다 알림
          // Test mode code removed - test methods no longer exist
          console.log('🔔 TEST MODE: Test notifications disabled')
        } else {
          // 프로덕션 모드: 매일 오전 9시
          // Cancel any test reminders if switching from test mode
          // Test reminder cancellation removed
          
          // 일일 리마인더 설정 (매일 오전 9시)
          // Schedule daily reminder at 9:00 AM if permission exists
          // 이미 스케줄되어 있는지 확인
          // Check if daily reminder is already scheduled
          const isScheduled = await NotificationService.isDailyReminderScheduled()
          if (!isScheduled) {
            // 스케줄되어 있지 않으면 새로 설정
            // Schedule if not already set
            const reminderId = await NotificationService.scheduleDailyReminder()
            if (reminderId) {
              console.log('Daily reminder scheduled at 9:00 AM:', reminderId)
            }
          } else {
            console.log('Daily reminder already scheduled')
          }
        }
      } else {
        console.log('No notification permission - skipping reminders')
      }
      
      // Check if this is first launch
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial')
      if (!hasSeenTutorial) {
        setShowTutorial(true)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing app:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return null // Or a loading screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingTutorial
          visible={showTutorial}
          onComplete={() => setShowTutorial(false)}
        />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={shouldShowOnboarding ? "Onboarding" : "Home"}
            screenOptions={{
              headerShown: false,
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress,
                },
              }),
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingPage} />
            <Stack.Screen name="Home" component={HomePage} />
            <Stack.Screen name="Timer" component={TimerPage} />
            <Stack.Screen name="Report" component={ReportPage} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}