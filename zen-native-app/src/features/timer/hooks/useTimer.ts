import { useState, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import BackgroundTimer from '../../../services/BackgroundTimer'

interface UseTimerProps {
  targetDuration: number
  onComplete?: () => void
  onTick?: (elapsed: number) => void
}

export const useTimer = ({ targetDuration, onComplete, onTick }: UseTimerProps) => {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const backgroundTimeRef = useRef<number>(0)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [isRunning, isPaused])

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isRunning && !isPaused) {
      backgroundTimeRef.current = Date.now()
    } else if (nextAppState === 'active' && isRunning && !isPaused && backgroundTimeRef.current) {
      const backgroundDuration = Date.now() - backgroundTimeRef.current
      setElapsedTime(prev => {
        const newElapsed = prev + backgroundDuration / 1000
        onTick?.(newElapsed)
        return newElapsed
      })
      backgroundTimeRef.current = 0
    }
  }

  useEffect(() => {
    let interval: string | null = null

    if (isRunning && !isPaused) {
      interval = BackgroundTimer.setInterval(() => {
        const currentElapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000
        setElapsedTime(currentElapsed)
        onTick?.(currentElapsed)

        if (currentElapsed >= targetDuration) {
          stop()
          onComplete?.()
        }
      }, 100)
    }

    return () => {
      if (interval) BackgroundTimer.clearInterval(interval)
    }
  }, [isRunning, isPaused, targetDuration])

  const start = () => {
    startTimeRef.current = Date.now()
    pausedTimeRef.current = 0
    setElapsedTime(0)
    setIsRunning(true)
    setIsPaused(false)
  }

  const pause = () => {
    if (isRunning && !isPaused) {
      pausedTimeRef.current += Date.now() - startTimeRef.current - pausedTimeRef.current - elapsedTime * 1000
      setIsPaused(true)
    }
  }

  const resume = () => {
    if (isRunning && isPaused) {
      const pauseDuration = Date.now() - (startTimeRef.current + elapsedTime * 1000)
      pausedTimeRef.current += pauseDuration
      setIsPaused(false)
    }
  }

  const stop = () => {
    setIsRunning(false)
    setIsPaused(false)
    setElapsedTime(0)
    startTimeRef.current = 0
    pausedTimeRef.current = 0
  }

  const timeLeft = Math.max(0, targetDuration - elapsedTime)
  const progress = targetDuration > 0 ? (elapsedTime / targetDuration) * 100 : 0

  return {
    isRunning,
    isPaused,
    elapsedTime,
    timeLeft,
    progress,
    start,
    pause,
    resume,
    stop,
  }
}