'use client'

import React from 'react'
import { Session } from '@/lib/store'
import { format } from 'date-fns'

interface TimelineChartProps {
  sessions: Session[]
  activities: Array<{ id: string; name: string; color?: string }>
  selectedDate: Date
}

export default function TimelineChart({ sessions, activities, selectedDate }: TimelineChartProps) {
  const getActivityColor = (activityId: string, index: number) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity?.color) return activity.color
    
    const colors = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB']
    return colors[index % colors.length]
  }

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    return format(sessionDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const sessionColors = new Map<string, string>()
  todaySessions.forEach((session) => {
    if (!sessionColors.has(session.activityId)) {
      sessionColors.set(session.activityId, getActivityColor(session.activityId, sessionColors.size))
    }
  })

  // Group overlapping sessions
  const groupedSessions: Session[][] = []
  todaySessions.forEach(session => {
    const sessionStart = new Date(session.startTime).getTime()
    const sessionEnd = session.endTime ? new Date(session.endTime).getTime() : sessionStart
    
    let added = false
    for (let group of groupedSessions) {
      const lastSession = group[group.length - 1]
      const lastEnd = lastSession.endTime ? new Date(lastSession.endTime).getTime() : new Date(lastSession.startTime).getTime()
      
      if (sessionStart >= lastEnd) {
        group.push(session)
        added = true
        break
      }
    }
    
    if (!added) {
      groupedSessions.push([session])
    }
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const hourWidth = 100 / 24

  return (
    <div className="w-full bg-gray-50 rounded-xl p-4">
      {/* Hour labels */}
      <div className="flex relative h-8 mb-2">
        {hours.map(hour => (
          <div
            key={hour}
            className="text-xs text-gray-500 font-light"
            style={{ width: `${hourWidth}%`, textAlign: 'center' }}
          >
            {hour % 3 === 0 ? `${hour}:00` : ''}
          </div>
        ))}
      </div>

      {/* Timeline tracks */}
      <div className="relative">
        {groupedSessions.map((group, trackIndex) => (
          <div key={trackIndex} className="relative h-10 mb-1">
            {/* Background grid */}
            <div className="absolute inset-0 flex">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="border-l border-gray-200"
                  style={{ width: `${hourWidth}%` }}
                />
              ))}
            </div>

            {/* Sessions */}
            {group.map(session => {
              const activity = activities.find(a => a.id === session.activityId)
              const startTime = new Date(session.startTime)
              const endTime = session.endTime ? new Date(session.endTime) : startTime
              
              const startHour = startTime.getHours() + startTime.getMinutes() / 60
              const endHour = endTime.getHours() + endTime.getMinutes() / 60
              
              const left = (startHour / 24) * 100
              const width = ((endHour - startHour) / 24) * 100

              return (
                <div
                  key={session.id}
                  className="absolute h-8 rounded-md flex items-center px-2 overflow-hidden"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: sessionColors.get(session.activityId) || '#000000',
                    top: '4px'
                  }}
                  title={`${activity?.name}: ${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                >
                  <span className="text-white text-xs font-light truncate">
                    {activity?.name}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        {groupedSessions.length === 0 && (
          <div className="h-10 flex items-center justify-center text-gray-400 font-light text-sm">
            No activities recorded
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          {Array.from(sessionColors.entries()).map(([activityId, color]) => {
            const activity = activities.find(a => a.id === activityId)
            const activitySessions = todaySessions.filter(s => s.activityId === activityId)
            const totalMinutes = activitySessions.reduce((sum, session) => {
              if (session.endTime) {
                return sum + (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000
              }
              return sum
            }, 0)

            return (
              <div key={activityId} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-light">
                  {activity?.name}: {Math.round(totalMinutes)} min
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}