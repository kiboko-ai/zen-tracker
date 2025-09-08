import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'

interface TimerDisplayProps {
  progress: number
  timeLeft: string
  color: string
  size?: number
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  progress,
  timeLeft,
  color,
  size = 250
}) => {
  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={size}
        width={15}
        fill={progress}
        tintColor={color}
        backgroundColor="#E5E5EA"
        rotation={0}
        lineCap="round"
      >
        {() => (
          <Text style={styles.timeText}>{timeLeft}</Text>
        )}
      </AnimatedCircularProgress>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1C1C1E',
  },
})