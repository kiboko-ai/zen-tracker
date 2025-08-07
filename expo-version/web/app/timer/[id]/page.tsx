'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

export default function TimerPage() {
  const router = useRouter()
  const params = useParams()
  const activityId = params.id as string
  
  const { activities, startSession, pauseSession, resumeSession, endSession, currentSession } = useStore()
  const activity = activities.find(a => a.id === activityId)
  
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [targetHours, setTargetHours] = useState(0)
  const [targetMinutes, setTargetMinutes] = useState(30)
  const [showTargetPicker, setShowTargetPicker] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showGradient, setShowGradient] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const targetSeconds = targetHours * 3600 + targetMinutes * 60

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1
          if (newSeconds === targetSeconds && targetSeconds > 0) {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 5000)
            setTimeout(() => setShowGradient(true), 1000)
          }
          return newSeconds
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, targetSeconds])

  const handleStart = () => {
    const targetDuration = targetSeconds > 0 ? targetSeconds * 1000 : undefined
    startSession(activityId, targetDuration)
    setIsRunning(true)
    setShowTargetPicker(false)
  }

  const handlePause = () => {
    pauseSession()
    setIsPaused(true)
  }

  const handleResume = () => {
    resumeSession()
    setIsPaused(false)
  }

  const handleStop = () => {
    endSession()
    router.push('/report')
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const formatTimeDisplay = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`
    }
    return `${minutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`
  }

  const progress = targetSeconds > 0 ? Math.min((seconds / targetSeconds) * 100, 100) : 0
  const isGoalReached = targetSeconds > 0 && seconds >= targetSeconds

  if (!activity) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div>Activity not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-white relative">
      <div className="ios-safe-area-top" />
      
      <AnimatePresence>
        {showGradient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="h-full w-full bg-gradient-to-b from-gray-100/30 via-transparent to-transparent animate-smoke" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 py-4">
        <button
          onClick={() => router.push('/home')}
          className="text-sm font-light text-gray-500"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {!isRunning ? (
          <h1 className="text-2xl font-light mb-8">
            {activity.name}
          </h1>
        ) : (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="text-2xl font-light mb-8"
          >
            {activity.name}
          </motion.h1>
        )}

        {showTargetPicker && !isRunning ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-xs"
          >
            <div className="text-center mb-8">
              <p className="text-sm font-light text-gray-500 mb-4">Set your target time</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    value={targetHours}
                    onChange={(e) => setTargetHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-16 h-16 text-2xl text-center border rounded-lg"
                    min="0"
                    max="23"
                  />
                  <span className="text-xs text-gray-500 mt-1">hours</span>
                </div>
                <span className="text-2xl">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-16 h-16 text-2xl text-center border rounded-lg"
                    min="0"
                    max="59"
                  />
                  <span className="text-xs text-gray-500 mt-1">minutes</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleStart}
              className="w-full py-4 bg-black text-white rounded-2xl font-light"
            >
              Start
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="timer-display"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-64 h-64 relative"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: progress > 0 ? 1 : 0 }}
              transition={{ duration: 1.5 }}
            >
              <CircularProgressbar
                value={progress}
                styles={buildStyles({
                  pathColor: isGoalReached ? '#22c55e' : '#000',
                  trailColor: '#f3f4f6',
                  pathTransitionDuration: 1,
                })}
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="text-4xl font-extralight mb-2">
                {formatTimeDisplay(seconds)}
              </div>
              {targetSeconds > 0 && !isGoalReached && (
                <div className="text-sm font-light text-gray-500">
                  Target: {formatTime(targetSeconds)}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/3 text-center"
            >
              <p className="text-2xl font-light">You've done it again!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isRunning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="mt-12 flex gap-4"
          >
            {!isPaused ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handlePause}
                className="w-24 h-24 rounded-full border-2 border-black flex items-center justify-center"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-black" />
                  <div className="w-1 h-6 bg-black" />
                </div>
              </motion.button>
            ) : (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleResume}
                  className="w-20 h-20 rounded-full bg-black flex items-center justify-center"
                >
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleStop}
                  className="w-20 h-20 rounded-full border-2 border-black flex items-center justify-center"
                >
                  <div className="w-6 h-6 bg-black" />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}