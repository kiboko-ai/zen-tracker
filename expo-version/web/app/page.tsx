'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function HomePage() {
  const router = useRouter()
  const { isFirstTime, setFirstTime } = useStore()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (isFirstTime) {
      setShowWelcome(true)
      setTimeout(() => {
        router.push('/onboarding')
      }, 3000)
    } else {
      router.push('/home')
    }
  }, [isFirstTime, router])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white px-8">
      <AnimatePresence>
        {showWelcome ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center justify-center space-y-8"
          >
            <div className="flex flex-col items-center space-y-2">
              <motion.h1 
                className="text-8xl font-extralight tracking-wider"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                ZEN
              </motion.h1>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full w-full items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}