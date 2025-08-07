'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

const defaultActivities = ['Meditate', 'Study', 'Workout', 'Read']

export default function OnboardingPage() {
  const router = useRouter()
  const { setFirstTime, setSelectedActivities, addActivity } = useStore()
  const [showMessage, setShowMessage] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    setTimeout(() => {
      setShowMessage(false)
    }, 3000)
  }, [])

  const handleSelectActivity = (activity: string) => {
    if (selectedItems.includes(activity)) {
      setSelectedItems(selectedItems.filter(item => item !== activity))
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, activity])
    }
  }

  const handleContinue = () => {
    selectedItems.forEach(activity => {
      addActivity(activity)
    })
    setSelectedActivities(selectedItems)
    setFirstTime(false)
    router.push('/home')
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="ios-safe-area-top" />
      
      <div className="flex-1 px-6 py-8">
        <motion.h1 
          className="text-2xl font-light mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Choose Your Zen
        </motion.h1>

        <AnimatePresence>
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-sm font-extralight text-gray-600 leading-relaxed">
                Welcome, stranger.
              </p>
              <p className="text-sm font-extralight text-gray-600 leading-relaxed mt-2">
                Choose your zen to start your day.
              </p>
              <p className="text-sm font-extralight text-gray-600 leading-relaxed mt-2">
                You can always add or edit them.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3 mt-12">
          {defaultActivities.map((activity, index) => (
            <motion.button
              key={activity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectActivity(activity)}
              className={`w-full py-4 px-6 rounded-2xl border transition-all duration-300 text-left ${
                selectedItems.includes(activity)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200'
              }`}
            >
              <span className="font-light text-lg">{activity}</span>
            </motion.button>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleContinue}
            className="fixed bottom-8 left-6 right-6 max-w-[418px] mx-auto py-4 bg-black text-white rounded-2xl font-light"
          >
            Continue
          </motion.button>
        )}
      </div>
    </div>
  )
}