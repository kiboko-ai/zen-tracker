'use client'

import React from 'react'
import { Session } from '@/lib/store'
import { format } from 'date-fns'

interface Clock24ChartImprovedProps {
  sessions: Session[]
  activities: Array<{ id: string; name: string; color?: string }>
  selectedDate: Date
}

export default function Clock24ChartImproved({ sessions, activities, selectedDate }: Clock24ChartImprovedProps) {
  const radius = 110
  const innerRadius = 70
  const center = 140
  const ringWidth = 8

  const getActivityColor = (activityId: string, index: number) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity?.color) return activity.color
    
    const colors = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB']
    return colors[index % colors.length]
  }

  const timeToAngle = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const totalMinutes = hours * 60 + minutes
    return (totalMinutes / 1440) * 360 - 90
  }

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    return format(sessionDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  // Group sessions by activity
  const sessionsByActivity = new Map<string, Session[]>()
  todaySessions.forEach(session => {
    const sessions = sessionsByActivity.get(session.activityId) || []
    sessions.push(session)
    sessionsByActivity.set(session.activityId, sessions)
  })

  const activityColors = new Map<string, string>()
  let colorIndex = 0
  sessionsByActivity.forEach((_, activityId) => {
    activityColors.set(activityId, getActivityColor(activityId, colorIndex++))
  })

  // Calculate total time per hour for heat map
  const hourlyIntensity = new Array(24).fill(0)
  todaySessions.forEach(session => {
    if (!session.endTime) return
    
    const startHour = new Date(session.startTime).getHours()
    const endHour = new Date(session.endTime).getHours()
    const startMinute = new Date(session.startTime).getMinutes()
    const endMinute = new Date(session.endTime).getMinutes()
    
    if (startHour === endHour) {
      hourlyIntensity[startHour] += (endMinute - startMinute) / 60
    } else {
      hourlyIntensity[startHour] += (60 - startMinute) / 60
      for (let h = startHour + 1; h < endHour; h++) {
        hourlyIntensity[h] = 1
      }
      if (endHour < 24) {
        hourlyIntensity[endHour] += endMinute / 60
      }
    }
  })

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="280" viewBox="0 0 280 280">
        {/* Background circles */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />

        {/* Hour heat map */}
        {hourlyIntensity.map((intensity, hour) => {
          const startAngle = (hour / 24) * 360 - 90
          const endAngle = ((hour + 1) / 24) * 360 - 90
          
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          
          const arcRadius = radius - 15
          
          const x1 = center + arcRadius * Math.cos(startRad)
          const y1 = center + arcRadius * Math.sin(startRad)
          const x2 = center + arcRadius * Math.cos(endRad)
          const y2 = center + arcRadius * Math.sin(endRad)
          
          const largeArcFlag = 0
          const path = `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
          
          if (intensity > 0) {
            return (
              <path
                key={`heat-${hour}`}
                d={path}
                stroke="#E5E7EB"
                strokeWidth="25"
                strokeLinecap="butt"
                fill="none"
                opacity={intensity * 0.8}
              />
            )
          }
          return null
        })}

        {/* Activity rings */}
        {Array.from(sessionsByActivity.entries()).map(([activityId, sessions], ringIndex) => {
          const ringRadius = innerRadius + (ringIndex + 1) * (ringWidth + 2)
          
          return sessions.map(session => {
            if (!session.endTime) return null
            
            const startAngle = timeToAngle(new Date(session.startTime))
            const endAngle = timeToAngle(new Date(session.endTime))
            
            const startRad = (startAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180
            
            const x1 = center + ringRadius * Math.cos(startRad)
            const y1 = center + ringRadius * Math.sin(startRad)
            const x2 = center + ringRadius * Math.cos(endRad)
            const y2 = center + ringRadius * Math.sin(endRad)
            
            let largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
            if (endAngle < startAngle) {
              largeArcFlag = 1
            }
            
            const path = `M ${x1} ${y1} A ${ringRadius} ${ringRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
            
            return (
              <path
                key={session.id}
                d={path}
                stroke={activityColors.get(activityId)}
                strokeWidth={ringWidth}
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
            )
          })
        })}

        {/* Hour ticks and labels */}
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
          const angle = (hour / 24) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const isMajor = hour % 6 === 0
          const tickLength = isMajor ? 6 : 3
          const x1 = center + (radius - tickLength) * Math.cos(rad)
          const y1 = center + (radius - tickLength) * Math.sin(rad)
          const x2 = center + radius * Math.cos(rad)
          const y2 = center + radius * Math.sin(rad)
          
          return (
            <g key={`hour-${hour}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "#6B7280" : "#D1D5DB"}
                strokeWidth={isMajor ? "1.5" : "0.5"}
              />
              {isMajor && (
                <text
                  x={center + (radius + 15) * Math.cos(rad)}
                  y={center + (radius + 15) * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-600 font-light"
                >
                  {hour === 0 ? '24' : hour}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 w-full">
        <div className="flex flex-wrap gap-3 justify-center">
          {Array.from(activityColors.entries()).map(([activityId, color]) => {
            const activity = activities.find(a => a.id === activityId)
            const activitySessions = sessionsByActivity.get(activityId) || []
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
                  {activity?.name}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(totalMinutes)}min
                </span>
              </div>
            )
          })}
        </div>

        {todaySessions.length === 0 && (
          <div className="text-center text-gray-400 font-light text-sm">
            No activities recorded for this day
          </div>
        )}
      </div>
    </div>
  )
}