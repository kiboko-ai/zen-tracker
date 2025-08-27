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
  AppState,
  AppStateStatus,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import { Picker } from '@react-native-picker/picker'
import WheelPicker from 'react-native-wheely'
import { useStore } from '../store/store'
import { RootStackParamList } from '../../App'
import BackgroundTimer from '../services/BackgroundTimer'

type TimerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Timer'>
type TimerScreenRouteProp = RouteProp<RootStackParamList, 'Timer'>

const { width } = Dimensions.get('window')

export default function TimerPage() {
  const navigation = useNavigation<TimerScreenNavigationProp>()
  const route = useRoute<TimerScreenRouteProp>()
  const activityId = route.params.id
  
  const { activities, startSession, pauseSession, resumeSession, endSession, currentSession, updateActivity } = useStore()
  const activity = activities.find(a => a.id === activityId)
  
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [targetHours, setTargetHours] = useState(activity?.lastTargetHours || 0)
  const [targetMinutes, setTargetMinutes] = useState(activity?.lastTargetMinutes || 0)
  const [showTargetPicker, setShowTargetPicker] = useState(true)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const completionDotAnim = useRef(new Animated.Value(0)).current
  const intervalRef = useRef<string | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const pausedDurationRef = useRef<number>(0)
  const pauseStartRef = useRef<Date | null>(null)
  const targetSeconds = targetHours * 3600 + targetMinutes * 60

  useEffect(() => {
    if (isRunning && !isPaused && startTimeRef.current) {
      // Use BackgroundTimer for accurate time tracking
      const id = BackgroundTimer.setBackgroundInterval(() => {
        if (startTimeRef.current) {
          const elapsed = BackgroundTimer.getElapsedTime(startTimeRef.current, pausedDurationRef.current)
          setSeconds(elapsed)
          
          // Animate completion dot when goal is reached
          if (elapsed >= targetSeconds && targetSeconds > 0) {
            Animated.spring(completionDotAnim, {
              toValue: 1,
              friction: 4,
              tension: 40,
              useNativeDriver: true,
            }).start()
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
  }, [isRunning, isPaused, targetSeconds, completionDotAnim])


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

  const handleStart = () => {
    const targetDuration = targetSeconds > 0 ? targetSeconds * 1000 : undefined
    startSession(activityId, targetDuration)
    updateActivity(activityId, { lastTargetHours: targetHours, lastTargetMinutes: targetMinutes })
    startTimeRef.current = new Date()
    pausedDurationRef.current = 0
    completionDotAnim.setValue(0) // Reset completion dot
    setIsRunning(true)
    setShowTargetPicker(false)
  }

  const handlePause = () => {
    pauseSession()
    pauseStartRef.current = new Date()
    setIsPaused(true)
  }

  const handleResume = () => {
    resumeSession()
    if (pauseStartRef.current) {
      const pauseDuration = Math.floor((new Date().getTime() - pauseStartRef.current.getTime()) / 1000)
      pausedDurationRef.current += pauseDuration
      pauseStartRef.current = null
    }
    setIsPaused(false)
  }

  const handleStop = () => {
    endSession()
    navigation.navigate('Report')
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
                    itemHeight={60}
                    visibleRest={2}
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
                    itemHeight={60}
                    visibleRest={2}
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
              <AnimatedCircularProgress
                size={width * 0.6}
                width={8}
                fill={progress}
                tintColor="#000"
                backgroundColor="#f3f4f6"
                rotation={0}
                lineCap="round"
              >
                {() => (
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
                )}
              </AnimatedCircularProgress>
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
  timerContent: {
    alignItems: 'center',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  androidPickerWrapper: {
    alignItems: 'center',
  },
  androidWheelContainer: {
    width: 90,
    height: 180,
  },
  androidWheelText: {
    fontSize: 26,
    color: '#111827',
    fontWeight: '300',
  },
  androidSelectedIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
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