import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import HomePage from './src/screens/HomePage'
import TimerPage from './src/screens/TimerPage'
import ReportPage from './src/screens/ReportPage'
import OnboardingPage from './src/screens/OnboardingPage'
import { useStore } from './src/store/store'

export type RootStackParamList = {
  Onboarding: undefined
  Home: undefined
  Timer: { id: string }
  Report: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function App() {
  const isFirstTime = useStore(state => state.isFirstTime)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={isFirstTime ? "Onboarding" : "Home"}
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