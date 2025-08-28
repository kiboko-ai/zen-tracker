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
      // Initialize notification service
      await NotificationService.getInstance().initialize()
      
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