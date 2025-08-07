'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

type TabType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function ReportPage() {
  const router = useRouter()
  const { sessions, activities } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  
  const now = new Date()

  const getDateRange = (tab: TabType) => {
    switch (tab) {
      case 'daily':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'weekly':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) }
    }
  }

  const filteredSessions = useMemo(() => {
    const range = getDateRange(activeTab)
    return sessions.filter(session => 
      isWithinInterval(new Date(session.startTime), range)
    )
  }, [sessions, activeTab])

  const stats = useMemo(() => {
    const totalTime = filteredSessions.reduce((acc, session) => acc + session.duration, 0)
    const avgTimePerDay = totalTime / (activeTab === 'daily' ? 1 : activeTab === 'weekly' ? 7 : activeTab === 'monthly' ? 30 : 365)
    
    const activityStats = activities.map(activity => {
      const activitySessions = filteredSessions.filter(s => s.activityId === activity.id)
      const activityTime = activitySessions.reduce((acc, session) => acc + session.duration, 0)
      return {
        id: activity.id,
        name: activity.name,
        totalTime: activityTime,
        percentage: totalTime > 0 ? (activityTime / totalTime) * 100 : 0,
        avgTime: activitySessions.length > 0 ? activityTime / activitySessions.length : 0,
        count: activitySessions.length
      }
    }).filter(stat => stat.totalTime > 0)
      .sort((a, b) => b.totalTime - a.totalTime)

    const longestSession = filteredSessions.reduce((max, session) => 
      session.duration > (max?.duration || 0) ? session : max, 
      null as typeof filteredSessions[0] | null
    )

    return {
      totalTime,
      avgTimePerDay,
      activityStats,
      longestDuration: longestSession?.duration || 0,
      sessionCount: filteredSessions.length
    }
  }, [filteredSessions, activities, activeTab])

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours.toFixed(1)} hour`
    }
    return `${minutes} min`
  }

  const getDateLabel = () => {
    switch (activeTab) {
      case 'daily':
        return format(now, 'yyyy. MM. dd')
      case 'weekly':
        return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy. MM. dd')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MM.dd')}`
      case 'monthly':
        return format(now, 'yyyy. MM')
      case 'yearly':
        return format(now, 'yyyy')
    }
  }

  const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB']

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="ios-safe-area-top" />
      
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/home')}
            className="text-sm font-light text-gray-500"
          >
            ← Back
          </button>
          <h1 className="text-xl font-light">Report</h1>
          <div className="w-12" />
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(['daily', 'weekly', 'monthly', 'yearly'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-md text-sm font-light capitalize transition-all ${
                activeTab === tab ? 'bg-black text-white' : 'text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide">
        <div className="mb-4">
          <p className="text-sm font-light text-gray-500">{getDateLabel()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-light text-gray-500 mb-1">Avg. focus time per day</p>
            <p className="text-xl font-light">{formatDuration(stats.avgTimePerDay)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-light text-gray-500 mb-1">Total focus time</p>
            <p className="text-xl font-light">{formatDuration(stats.totalTime)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-light text-gray-500 mb-1">Avg. focus time per activity</p>
            <p className="text-xl font-light">
              {stats.activityStats.length > 0 
                ? formatDuration(stats.totalTime / stats.activityStats.length)
                : '0 min'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-light text-gray-500 mb-1">Longest total focus time</p>
            <p className="text-xl font-light">{formatDuration(stats.longestDuration)}</p>
          </div>
        </div>

        {stats.activityStats.length > 0 && (
          <>
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.activityStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {stats.activityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {stats.activityStats.map((stat, index) => (
                  <div key={stat.id} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs font-light">
                      {stat.name}
                    </span>
                    <span className="text-xs font-light text-gray-500">
                      {stat.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {stats.activityStats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-light">{stat.name}</span>
                    <span className="text-sm font-light text-gray-500">
                      {formatDuration(stat.totalTime)} / {formatDuration(stat.avgTime)}
                    </span>
                  </div>
                  <div className="text-xs font-light text-gray-500">
                    total / avg.
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {stats.activityStats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-400 font-light">No activities recorded yet</p>
            <button
              onClick={() => router.push('/home')}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg font-light"
            >
              Start Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  )
}