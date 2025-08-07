'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { format } from 'date-fns'

export default function HomePage() {
  const router = useRouter()
  const { activities, addActivity, removeActivity, updateActivity } = useStore()
  const [editMode, setEditMode] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAddActivity = () => {
    setShowKeyboard(true)
    setNewActivityName('')
    setEditingId('new')
  }

  const handleSaveNewActivity = () => {
    if (newActivityName.trim()) {
      addActivity(newActivityName)
      setNewActivityName('')
      setShowKeyboard(false)
      setEditingId(null)
    } else {
      setShowKeyboard(false)
      setEditingId(null)
    }
  }

  const handleEditActivity = (id: string, currentName: string) => {
    setEditingId(id)
    setNewActivityName(currentName)
    setShowKeyboard(true)
  }

  const handleUpdateActivity = () => {
    if (editingId && editingId !== 'new' && newActivityName.trim()) {
      updateActivity(editingId, { name: newActivityName })
    }
    setEditingId(null)
    setNewActivityName('')
    setShowKeyboard(false)
  }

  const handleRemoveActivity = (id: string) => {
    removeActivity(id)
    setRemovingId(null)
  }

  const handleStartActivity = (activityId: string) => {
    router.push(`/timer/${activityId}`)
  }

  const sortedActivities = [...activities].sort((a, b) => {
    const hourNow = currentTime.getHours()
    const getActivityScore = (activity: typeof a) => {
      const lastUsedHour = new Date(activity.lastUsed).getHours()
      const hourDiff = Math.abs(hourNow - lastUsedHour)
      return hourDiff
    }
    return getActivityScore(a) - getActivityScore(b)
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-full w-full flex-col bg-white"
    >
      <div className="ios-safe-area-top" />
      
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <motion.div 
            className="text-4xl font-extralight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {format(currentTime, 'HH:mm')}
          </motion.div>
          <button
            onClick={() => router.push('/report')}
            className="p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="4" fill="black" opacity="0.8"/>
              <rect x="4" y="10" width="16" height="2" fill="black" opacity="0.6"/>
              <rect x="4" y="14" width="16" height="2" fill="black" opacity="0.4"/>
              <rect x="4" y="18" width="16" height="2" fill="black" opacity="0.2"/>
            </svg>
          </button>
        </div>
        <div className="text-sm font-extralight text-gray-500">
          {format(currentTime, 'yyyy. MM. dd')}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide flex flex-col justify-center" style={{ paddingBottom: '60%' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light">Choose Your Zen</h2>
          <div className="flex gap-2">
            {!editMode ? (
              <>
                <button
                  onClick={handleAddActivity}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                >
                  <span className="text-xl font-light">+</span>
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1 text-sm font-light border border-gray-300 rounded-full"
                >
                  edit
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false)
                  setRemovingId(null)
                }}
                className="px-3 py-1 text-sm font-light bg-black text-white rounded-full"
              >
                done
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {editingId === 'new' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="py-4 px-6 rounded-2xl border border-black bg-white">
                <input
                  type="text"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  onBlur={handleSaveNewActivity}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveNewActivity()}
                  placeholder="name your Zen"
                  className="w-full bg-transparent outline-none font-light text-lg"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {sortedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: editingId && editingId !== activity.id ? 0.95 : 1
              }}
              transition={{ 
                layout: { duration: 0.3 },
                opacity: { duration: 0.2 },
                x: { duration: 0.3 }
              }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <button
                  onClick={() => !editMode && handleStartActivity(activity.id)}
                  disabled={editMode}
                  className={`w-full py-4 px-6 transition-all duration-300 text-left relative bg-black text-white`}
                >
                  {editingId === activity.id ? (
                    <input
                      type="text"
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                      onBlur={handleUpdateActivity}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateActivity()}
                      className="w-full bg-transparent outline-none font-light text-lg text-white"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-light text-lg"
                      onClick={(e) => {
                        if (editMode) {
                          e.stopPropagation()
                          handleEditActivity(activity.id, activity.name)
                        }
                      }}
                    >
                      {activity.name}
                    </span>
                  )}
                </button>

                {editMode && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: removingId === activity.id ? '0%' : '100%' }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="absolute inset-y-0 right-0 w-24 bg-white flex items-center justify-center rounded-r-2xl border border-black border-l-0"
                    >
                      <button
                        onClick={() => handleRemoveActivity(activity.id)}
                        className="text-black font-light text-sm"
                      >
                        remove
                      </button>
                    </motion.div>
                  </AnimatePresence>
                )}

                {editMode && removingId !== activity.id && (
                  <button
                    onClick={() => setRemovingId(activity.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <span className="text-xl font-light">−</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showKeyboard && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 max-w-[430px] mx-auto"
        >
          <div className="text-center text-sm text-gray-500 mb-2">iOS Keyboard Simulation</div>
          <button
            onClick={() => {
              if (editingId === 'new') {
                handleSaveNewActivity()
              } else {
                handleUpdateActivity()
              }
            }}
            className="w-full py-3 bg-blue-500 text-white rounded-lg"
          >
            return
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}