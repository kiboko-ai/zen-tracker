import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  NativeModules,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Picker } from '@react-native-picker/picker'
import WheelPicker from 'react-native-wheely'
import Svg, { Circle } from 'react-native-svg'
import { format } from 'date-fns'
import { useStore } from '../store/store'
import { RootStackParamList } from '../../App'
import { useNotifications } from '../hooks/useNotifications'
import LiveActivityService from '../services/notifications/LiveActivityService'
import AnalyticsService from '../services/AnalyticsService'
import { TimerDisplay, TimerControls } from '../features/timer/components'
import { useTimer } from '../features/timer/hooks/useTimer'
import { formatTime, formatDuration } from '../shared/utils/time'
import BackgroundTimer from '../services/BackgroundTimer'

type TimerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Timer'>
type TimerScreenRouteProp = RouteProp<RootStackParamList, 'Timer'>

const { width } = Dimensions.get('window')

export default function TimerPage() {
  const navigation = useNavigation<TimerScreenNavigationProp>()
  const route = useRoute<TimerScreenRouteProp>()
  const activityId = route.params.id
  
  const { 
    activities, 
    startSession, 
    pauseSession, 
    resumeSession, 
    endSession, 
    currentSession, 
    updateActivity,
    lastDailyReminderCancelDate,
    setLastDailyReminderCancelDate
  } = useStore()
  const activity = activities.find(a => a.id === activityId)
  
  // Notification hooks
  const {
    hasPermission,
    requestPermission,
    showPermissionDeniedAlert,
    scheduleGoalNotification,
    scheduleCompletionNotification,
    scheduleHourlyNotification,
    scheduleTargetPlusOneHourNotification,
    scheduleTwoXTargetNotification,
    scheduleThirtyMinuteIntervals,
    scheduleDailyReminder,         // 일일 리마인더 스케줄링 함수 추가
    isDailyReminderScheduled,      // 일일 리마인더 상태 확인 함수 추가
    cancelDailyReminder,           // 일일 리마인더 취소 함수 추가
    cancelNotification,
    cancelAllNotifications,
    scheduleNotificationWithDelay,
    startLiveActivity
  } = useNotifications()
  
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [targetHours, setTargetHours] = useState(activity?.lastTargetHours || 0)
  const [targetMinutes, setTargetMinutes] = useState(activity?.lastTargetMinutes || 0)
  const [showTargetPicker, setShowTargetPicker] = useState(true)
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false)
  const [goalNotificationId, setGoalNotificationId] = useState<string | null>(null)
  const [hourlyNotificationId, setHourlyNotificationId] = useState<string | null>(null)
  const [targetPlusHourNotificationId, setTargetPlusHourNotificationId] = useState<string | null>(null)
  const [twoXTargetNotificationId, setTwoXTargetNotificationId] = useState<string | null>(null)
  const [thirtyMinIntervalIds, setThirtyMinIntervalIds] = useState<string[]>([])
  const [hasNotifiedGoal, setHasNotifiedGoal] = useState(false)
  const [hasNotifiedTargetPlusHour, setHasNotifiedTargetPlusHour] = useState(false)
  const [hasNotifiedTwoXTarget, setHasNotifiedTwoXTarget] = useState(false)
  const [liveActivityId, setLiveActivityId] = useState<string | null>(null)
  const [checkInNotificationId, setCheckInNotificationId] = useState<string | null>(null)
  const [checkInNotificationIds, setCheckInNotificationIds] = useState<string[]>([])
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const completionDotAnim = useRef(new Animated.Value(0)).current
  const intervalRef = useRef<string | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const pausedDurationRef = useRef<number>(0)
  const pauseStartRef = useRef<Date | null>(null)
  const targetSeconds = targetHours * 3600 + targetMinutes * 60

  useEffect(() => {
    console.log('🔴 useEffect triggered - isRunning:', isRunning, 'isPaused:', isPaused, 'liveActivityId:', liveActivityId)
    if (isRunning && startTimeRef.current) {  // Remove !isPaused condition to keep updating Live Activity
      // Use BackgroundTimer for accurate time tracking
      const id = BackgroundTimer.setBackgroundInterval(() => {
        if (startTimeRef.current) {
          // When paused, use the frozen elapsed time, otherwise calculate current
          const elapsed = isPaused 
            ? seconds  // Use the frozen time when paused
            : BackgroundTimer.getElapsedTime(startTimeRef.current, pausedDurationRef.current)
          
          // Only update seconds when not paused
          if (!isPaused) {
            setSeconds(elapsed)
          }
          
          // ALWAYS update Live Activity to reflect current state
          if (liveActivityId) {
            console.log(`📱 Updating Live Activity - elapsed: ${elapsed}, isPaused: ${isPaused}`)
            LiveActivityService.updateActivity(liveActivityId, elapsed, isPaused)
          }
          
          // Animate completion dot when goal is reached
          if (elapsed >= targetSeconds && targetSeconds > 0) {
            Animated.spring(completionDotAnim, {
              toValue: 1,
              friction: 4,
              tension: 40,
              useNativeDriver: true,
            }).start()
            
            // Mark goal as notified when reached (notification already scheduled at start)
            if (!hasNotifiedGoal) {
              setHasNotifiedGoal(true)
            }
            
            // Mark 2x target as notified when reached
            if (elapsed >= targetSeconds * 2 && !hasNotifiedTwoXTarget) {
              setHasNotifiedTwoXTarget(true)
            }
            
            // Mark target+1hr as notified when reached
            if (elapsed >= targetSeconds + 3600 && !hasNotifiedTargetPlusHour) {
              setHasNotifiedTargetPlusHour(true)
            }
          }
        }
      }, 1000)
      
      intervalRef.current = id
    } else {
      if (intervalRef.current) {
        BackgroundTimer.clearBackgroundInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        BackgroundTimer.clearBackgroundInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isPaused, targetSeconds, completionDotAnim, liveActivityId, hasNotifiedGoal, hasNotifiedTargetPlusHour, hasNotifiedTwoXTarget])


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isRunning])

  const handleStart = async () => {
    // Request notification permission on first timer start
    if (!hasRequestedPermission && !hasPermission) {
      const granted = await requestPermission()
      setHasRequestedPermission(true)
      
      if (!granted) {
        // Show permission denied message but continue with timer
        showPermissionDeniedAlert()
      } else {
        // 권한이 승인되면 일일 리마인더도 자동으로 설정
        // If permission granted, also schedule daily reminder
        try {
          const isScheduled = await isDailyReminderScheduled()
          if (!isScheduled) {
            const reminderId = await scheduleDailyReminder()
            if (reminderId) {
              console.log('Daily reminder auto-scheduled after permission grant:', reminderId)
            }
          }
        } catch (error) {
          console.error('Failed to schedule daily reminder:', error)
        }
      }
    }
    
    const targetDuration = targetSeconds > 0 ? targetSeconds * 1000 : undefined
    startSession(activityId, targetDuration)
    updateActivity(activityId, { lastTargetHours: targetHours, lastTargetMinutes: targetMinutes })
    startTimeRef.current = new Date()
    pausedDurationRef.current = 0
    completionDotAnim.setValue(0) // Reset completion dot
    setHasNotifiedGoal(false) // Reset goal notification flag
    setHasNotifiedTwoXTarget(false) // Reset 2x target notification flag
    setHasNotifiedTargetPlusHour(false) // Reset target+1hr notification flag
    setIsRunning(true)
    setShowTargetPicker(false)
    
    // Log timer start event
    if (activity) {
      const targetMinutes = targetHours * 60 + targetMinutes
      AnalyticsService.logTimerStart(activityId, activity.name, targetMinutes)
    }
    
    // Check if it's before 9 AM and cancel daily reminder if not already cancelled today
    const now = new Date()
    const currentHour = now.getHours()
    const today = format(now, 'yyyy-MM-dd')
    
    if (currentHour < 9 && lastDailyReminderCancelDate !== today) {
      // Activity started before 9 AM, cancel today's daily reminder
      console.log('Activity started before 9 AM, cancelling daily reminder for today')
      await cancelDailyReminder()
      setLastDailyReminderCancelDate(today)
    }
    
    if (activity && hasPermission) {
      if (targetSeconds > 0) {
        const targetMinutes = Math.floor(targetSeconds / 60)
        
        // Case 1: 목표달성 Push
        const goalId = await scheduleGoalNotification(activity.name, targetMinutes, targetSeconds)
        setGoalNotificationId(goalId)
        
        // Case 3: 2x 목표달성 Push
        const twoXId = await scheduleTwoXTargetNotification(activity.name, targetMinutes)
        setTwoXTargetNotificationId(twoXId)
        
        // Case 2 & 4: 30분 간격 Push 스케줄링
        // 특별한 경우: 15, 45, 75분 등 (15 + 30*n)
        const is15PlusMultiple30 = targetMinutes === 15 || (targetMinutes > 15 && (targetMinutes - 15) % 30 === 0)
        
        if (is15PlusMultiple30) {
          // Case 4: 2x 이후부터 30분 간격
          const startAfter = targetMinutes * 2 // 2x 목표 이후부터 시작
          const intervalIds = await scheduleThirtyMinuteIntervals(activity.name, startAfter, 10)
          setThirtyMinIntervalIds(intervalIds)
        } else if (targetMinutes >= 30) {
          // Case 2: 설정시간이 30분 이상이면 30분 초과 시점부터 30분 간격
          const firstInterval = Math.ceil(targetMinutes / 30) * 30 // 다음 30분 배수
          if (firstInterval > targetMinutes) {
            // 첫 30분 간격 알림부터 시작 (목표 시간과 겹치지 않도록)
            const intervalIds = await scheduleThirtyMinuteIntervals(activity.name, firstInterval - 30, 10)
            setThirtyMinIntervalIds(intervalIds)
          }
        } else {
          // 30분 미만 목표: 30분, 60분, 90분... 알림
          const intervalIds = await scheduleThirtyMinuteIntervals(activity.name, 0, 10)
          setThirtyMinIntervalIds(intervalIds)
        }
      } else {
        // Infinity mode (00:00): 30분 간격 알림
        const intervalIds = await scheduleThirtyMinuteIntervals(activity.name, 0, 20)
        setThirtyMinIntervalIds(intervalIds)
      }
    }
    
    // Start Live Activity (iOS 16.1+, no permission needed)
    if (activity) {
      console.log('🟢 Starting Live Activity...')
      const targetMinutes = targetSeconds > 0 ? Math.floor(targetSeconds / 60) : 0  // 0 for infinity mode
      const activityId = await startLiveActivity(activity.name, targetMinutes)
      console.log(`🟢 Live Activity started - Mode: ${targetSeconds > 0 ? `${targetMinutes}min` : 'Infinity'}, ID: ${activityId}`)
      setLiveActivityId(activityId)
    }
  }

  const handlePause = async () => {
    console.log('⏸️ PAUSE BUTTON PRESSED')
    pauseSession()
    pauseStartRef.current = new Date()
    setIsPaused(true)
    
    // Cancel all scheduled notifications when pausing
    console.log('⏸️ Cancelling notifications on pause')
    
    // Cancel hourly notification
    if (hourlyNotificationId) {
      await cancelNotification(hourlyNotificationId)
      // Don't clear, will reschedule on resume
    }
    
    // Cancel goal notification if not yet achieved
    if (goalNotificationId && !hasNotifiedGoal) {
      await cancelNotification(goalNotificationId)
      // Don't clear, will reschedule on resume
    }
    
    // Cancel target+1hr notification if not yet achieved
    if (targetPlusHourNotificationId && !hasNotifiedTargetPlusHour) {
      await cancelNotification(targetPlusHourNotificationId)
      // Don't clear, will reschedule on resume
    }
    
    // Cancel 2x target notification if not yet achieved
    if (twoXTargetNotificationId && !hasNotifiedTwoXTarget) {
      await cancelNotification(twoXTargetNotificationId)
      // Don't clear, will reschedule on resume
    }
    
    // Cancel 30-minute interval notifications
    if (thirtyMinIntervalIds.length > 0) {
      for (const id of thirtyMinIntervalIds) {
        await cancelNotification(id)
      }
      // Don't clear, will reschedule on resume
    }
    
    // Send pause state to Live Activity
    if (liveActivityId && startTimeRef.current) {
      const currentElapsed = BackgroundTimer.getElapsedTime(startTimeRef.current, pausedDurationRef.current)
      console.log('⏸️ Sending pause state with elapsed:', currentElapsed)
      await LiveActivityService.updateActivity(liveActivityId, currentElapsed, true)
    }
  }

  const handleResume = async () => {
    console.log('▶️ RESUME BUTTON PRESSED')
    resumeSession()
    if (pauseStartRef.current) {
      const pauseDuration = Math.floor((new Date().getTime() - pauseStartRef.current.getTime()) / 1000)
      pausedDurationRef.current += pauseDuration
      pauseStartRef.current = null
    }
    setIsPaused(false)
    
    // Reschedule notifications based on remaining time
    console.log('▶️ Rescheduling notifications on resume')
    const currentElapsed = seconds // Current elapsed seconds
    
    if (activity) {
      // Reschedule goal notification if not yet achieved
      if (goalNotificationId && !hasNotifiedGoal && targetSeconds > 0) {
        const remainingSeconds = targetSeconds - currentElapsed
        if (remainingSeconds > 0) {
          const newGoalId = await scheduleNotificationWithDelay(
            'Zen Tracker',
            `Great job! You've reached your ${Math.floor(targetSeconds / 60)} minute goal for ${activity.name}! 🎯`,
            remainingSeconds,
            { type: 'goal_achieved', activityName: activity.name }
          )
          setGoalNotificationId(newGoalId)
        }
      }
      
      // Reschedule target+1hr notification if not yet achieved
      if (targetPlusHourNotificationId && !hasNotifiedTargetPlusHour && targetSeconds > 0) {
        const targetPlusHour = targetSeconds + 3600
        const remainingToTargetPlusHour = targetPlusHour - currentElapsed
        if (remainingToTargetPlusHour > 0) {
          const targetMinutes = Math.floor(targetSeconds / 60)
          const totalMinutes = targetMinutes + 60
          const newTargetPlusHourId = await scheduleNotificationWithDelay(
            'Zen Tracker',
            `You've been focusing on ${activity.name} for ${totalMinutes} minutes - an hour past your goal!`,
            remainingToTargetPlusHour,
            { type: 'target_plus_hour', activityName: activity.name }
          )
          setTargetPlusHourNotificationId(newTargetPlusHourId)
        }
      }
      
      // Reschedule 2x target notification if not yet achieved
      if (twoXTargetNotificationId && !hasNotifiedTwoXTarget && targetSeconds > 0) {
        const twoXTarget = targetSeconds * 2
        const remainingToTwoXTarget = twoXTarget - currentElapsed
        if (remainingToTwoXTarget > 0) {
          const targetMinutes = Math.floor(targetSeconds / 60)
          const twoXMinutes = targetMinutes * 2
          const newTwoXId = await scheduleNotificationWithDelay(
            'Zen Tracker',
            `Amazing! You've reached 2x your goal - ${twoXMinutes} minutes of ${activity.name}! 🎯`,
            remainingToTwoXTarget,
            { type: 'two_x_target', activityName: activity.name }
          )
          setTwoXTargetNotificationId(newTwoXId)
        }
      }
      
      // Reschedule 30-minute intervals
      if (thirtyMinIntervalIds.length > 0) {
        const newIntervalIds: string[] = []
        const currentMinutes = Math.floor(currentElapsed / 60)
        const nextThirtyMin = Math.ceil(currentMinutes / 30) * 30
        
        // Schedule next 10 30-minute intervals
        for (let i = 0; i < 10; i++) {
          const targetMin = nextThirtyMin + (i * 30)
          const remainingSeconds = (targetMin * 60) - currentElapsed
          if (remainingSeconds > 0) {
            const notificationId = await scheduleNotificationWithDelay(
              'Zen Tracker',
              `You've been focusing on ${activity.name} for ${targetMin} minutes.`,
              remainingSeconds,
              { type: 'thirty_minute_interval', activityName: activity.name, totalMinutes: targetMin }
            )
            if (notificationId) {
              newIntervalIds.push(notificationId)
            }
          }
        }
        setThirtyMinIntervalIds(newIntervalIds)
      }
      
      // Reschedule hourly notification for infinity mode
      if (hourlyNotificationId && targetSeconds === 0) {
        const nextHour = Math.ceil(currentElapsed / 3600) * 3600
        const remainingToNextHour = nextHour - currentElapsed
        const newHourlyId = await scheduleNotificationWithDelay(
          'Zen Tracker',
          `You've been focusing on ${activity.name} for ${Math.ceil(currentElapsed / 3600)} hour(s).`,
          remainingToNextHour,
          { type: 'hourly_check', activityName: activity.name }
        )
        setHourlyNotificationId(newHourlyId)
      }
    }
    
    // Send resume state to Live Activity
    if (liveActivityId && startTimeRef.current) {
      const currentElapsed = BackgroundTimer.getElapsedTime(startTimeRef.current, pausedDurationRef.current)
      console.log('▶️ Sending resume state with elapsed:', currentElapsed)
      await LiveActivityService.updateActivity(liveActivityId, currentElapsed, false)
    }
  }

  const handleStop = async () => {
    console.log('⏹️ STOP BUTTON PRESSED')
    
    // Log timer stop event
    if (activity) {
      AnalyticsService.logTimerStop(activityId, activity.name, seconds)
    }
    
    // End Live Activity FIRST (most important for user)
    if (liveActivityId) {
      console.log('⏹️ Ending Live Activity:', liveActivityId)
      try {
        await LiveActivityService.endActivity(liveActivityId)
        setLiveActivityId(null)
      } catch (error) {
        console.error('Failed to end Live Activity:', error)
      }
    }
    
    // End the session and navigate
    console.log('⏹️ Calling endSession...')
    endSession()
    console.log('⏹️ Navigating to Report...')
    navigation.navigate('Report')
    
    // Then clean up notifications asynchronously
    const cleanupNotifications = async () => {
      // Cancel all scheduled notifications
      if (checkInNotificationId) {
        await cancelNotification(checkInNotificationId)
      }
      
      // Cancel smart check-in notifications
      if (checkInNotificationIds.length > 0) {
        for (const id of checkInNotificationIds) {
          await cancelNotification(id)
        }
      }
      
      if (hourlyNotificationId) {
        await cancelNotification(hourlyNotificationId)
      }
      
      if (goalNotificationId && !hasNotifiedGoal) {
        await cancelNotification(goalNotificationId)
      }
      
      if (targetPlusHourNotificationId && !hasNotifiedTargetPlusHour) {
        await cancelNotification(targetPlusHourNotificationId)
      }
      
      if (twoXTargetNotificationId && !hasNotifiedTwoXTarget) {
        await cancelNotification(twoXTargetNotificationId)
      }
      
      if (thirtyMinIntervalIds.length > 0) {
        for (const id of thirtyMinIntervalIds) {
          await cancelNotification(id)
        }
      }
    }
    
    cleanupNotifications()
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatTimeDisplay = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = targetSeconds > 0 ? Math.min((seconds / targetSeconds) * 100, 100) : 0
  const isGoalReached = targetSeconds > 0 && seconds >= targetSeconds

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>Activity not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {showTargetPicker && !isRunning && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <Animated.Text 
          style={[
            styles.activityTitle,
            {
              opacity: isRunning ? fadeAnim : 1,
            }
          ]}
        >
          {activity.name}
        </Animated.Text>

        {showTargetPicker && !isRunning ? (
          <View style={styles.targetPicker}>
            <Text style={styles.targetLabel}>Set your target time</Text>
            
            {Platform.OS === 'ios' ? (
              // iOS - Native Picker
              <View>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={targetHours}
                      onValueChange={(value) => setTargetHours(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {[...Array(24)].map((_, i) => (
                        <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i} />
                      ))}
                    </Picker>
                  </View>
                  
                  <Text style={styles.pickerSeparator}>:</Text>
                  
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={targetMinutes}
                      onValueChange={(value) => setTargetMinutes(value)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {[...Array(60)].map((_, i) => (
                        <Picker.Item 
                          key={i} 
                          label={targetHours === 0 && i === 0 ? '∞' : i.toString().padStart(2, '0')} 
                          value={i} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            ) : (
              // Android - WheelPicker
              <View style={styles.androidPickerContainer}>
                <View style={styles.androidPickerWrapper}>
                  <WheelPicker
                    selectedIndex={targetHours}
                    options={[...Array(24)].map((_, i) => i.toString().padStart(2, '0'))}
                    onChange={(index) => setTargetHours(index)}
                    containerStyle={styles.androidWheelContainer}
                    itemTextStyle={styles.androidWheelText}
                    selectedIndicatorStyle={styles.androidSelectedIndicator}
                    itemHeight={45}
                    visibleRest={1}
                    decelerationRate="fast"
                  />
                  <Text style={styles.androidPickerLabel}>hours</Text>
                </View>
                
                <Text style={styles.androidPickerSeparator}>:</Text>
                
                <View style={styles.androidPickerWrapper}>
                  <WheelPicker
                    selectedIndex={targetMinutes}
                    options={[...Array(60)].map((_, i) => 
                      targetHours === 0 && i === 0 ? '∞' : i.toString().padStart(2, '0')
                    )}
                    onChange={(index) => setTargetMinutes(index)}
                    containerStyle={styles.androidWheelContainer}
                    itemTextStyle={styles.androidWheelText}
                    selectedIndicatorStyle={styles.androidSelectedIndicator}
                    itemHeight={45}
                    visibleRest={1}
                    decelerationRate="fast"
                  />
                  <Text style={styles.androidPickerLabel}>minutes</Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity
              onPress={handleStart}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.timerDisplay,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={styles.progressContainer}>
              <View style={styles.circularProgressContainer}>
                <Svg
                  width={width * 0.6}
                  height={width * 0.6}
                  style={styles.progressSvg}
                >
                  <Circle
                    cx={width * 0.3}
                    cy={width * 0.3}
                    r={(width * 0.6 - 16) / 2}
                    stroke="#f3f4f6"
                    strokeWidth={8}
                    fill="none"
                  />
                  <Circle
                    cx={width * 0.3}
                    cy={width * 0.3}
                    r={(width * 0.6 - 16) / 2}
                    stroke="#000"
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={`${Math.PI * (width * 0.6 - 16)}`}
                    strokeDashoffset={`${Math.PI * (width * 0.6 - 16) * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${width * 0.3} ${width * 0.3})`}
                  />
                </Svg>
                <View style={styles.timerContent}>
                  <Text style={[styles.timeText, seconds >= 3600 && styles.timeTextSmall]}>
                    {formatTimeDisplay(seconds)}
                  </Text>
                  {targetSeconds > 0 && (
                    <Text style={styles.targetText}>
                      Target: {formatTime(targetSeconds)}
                    </Text>
                  )}
                </View>
              </View>
              {isGoalReached && (
                <Animated.View 
                  style={[
                    styles.completionDot,
                    {
                      opacity: completionDotAnim,
                      transform: [{ scale: completionDotAnim }],
                    }
                  ]}
                />
              )}
            </View>
          </Animated.View>
        )}


        {isRunning && (
          <Animated.View 
            style={[
              styles.controls,
              { opacity: fadeAnim }
            ]}
          >
            {!isPaused ? (
              <TouchableOpacity
                onPress={handlePause}
                style={styles.pauseButton}
              >
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.pausedControls}>
                <TouchableOpacity
                  onPress={handleResume}
                  style={styles.resumeButton}
                >
                  <View style={styles.playIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStop}
                  style={styles.stopButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={styles.stopIcon} />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 32,
  },
  targetPicker: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
    marginBottom: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    width: 64,
    height: 64,
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerWrapper: {
    width: 90,
    height: 200,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  picker: {
    width: 90,
    height: 200,
  },
  pickerItem: {
    fontSize: 24,
    height: 200,
    color: '#111827',
    fontWeight: '300',
  },
  pickerSeparator: {
    fontSize: 28,
    fontWeight: '200',
    marginHorizontal: 8,
    color: '#111827',
  },
  startButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: 'black',
    borderRadius: 16,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
    height: width * 0.6,
    justifyContent: 'center',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressContainer: {
    position: 'relative',
    width: width * 0.6,
    height: width * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '200',
    marginBottom: 8,
  },
  timeTextSmall: {
    fontSize: 36,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  completionDot: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  controls: {
    marginTop: 48,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 24,
    backgroundColor: 'black',
  },
  pausedControls: {
    flexDirection: 'row',
    gap: 16,
  },
  resumeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderLeftColor: 'white',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'black',
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerPlaceholder: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    fontSize: 24,
    color: '#111827',
    fontWeight: '300',
    opacity: 0.3,
    zIndex: 1,
  },
  pickerUnitLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '300',
  },
  androidPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  androidPickerWrapper: {
    alignItems: 'center',
  },
  androidWheelContainer: {
    width: 90,
    height: 135,
  },
  androidWheelText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '300',
    lineHeight: 45,
  },
  androidSelectedIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    height: 45,
  },
  androidPickerSeparator: {
    fontSize: 28,
    fontWeight: '200',
    marginHorizontal: 12,
    color: '#111827',
  },
  androidPickerLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '400',
  },
})