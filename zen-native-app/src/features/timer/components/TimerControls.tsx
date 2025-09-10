import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'

interface TimerControlsProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  color: string
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  color,
}) => {
  if (!isRunning) {
    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color }]}
        onPress={onStart}
      >
        <Text style={styles.buttonText}>시작</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={onStop}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>정지</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color }]}
        onPress={isPaused ? onResume : onPause}
      >
        <Text style={styles.buttonText}>
          {isPaused ? '재개' : '일시정지'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryButton: {
    backgroundColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
  },
})