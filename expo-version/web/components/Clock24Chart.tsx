'use client'

import React from 'react'
import { Session } from '@/lib/store'
import { format } from 'date-fns'

interface Clock24ChartProps {
  sessions: Session[]
  activities: Array<{ id: string; name: string; color?: string }>
  selectedDate: Date
}

export default function Clock24Chart({ sessions, activities, selectedDate }: Clock24ChartProps) {
  const radius = 110
  const innerRadius = 75
  const center = 140
  const strokeWidth = 30

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

  const drawArc = (startTime: Date, endTime: Date) => {
    const startAngle = timeToAngle(startTime)
    let endAngle = timeToAngle(endTime)
    
    if (endAngle <= startAngle) {
      endAngle += 360
    }
    
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    
    const arcRadius = radius - strokeWidth / 2
    
    const x1 = center + arcRadius * Math.cos(startRad)
    const y1 = center + arcRadius * Math.sin(startRad)
    const x2 = center + arcRadius * Math.cos(endRad)
    const y2 = center + arcRadius * Math.sin(endRad)
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    
    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
  }

  const formatTimeLabel = (hour: number) => {
    return hour === 0 ? '24' : hour.toString().padStart(2, '0')
  }

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    return format(sessionDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  })

  const sessionColors = new Map<string, string>()
  todaySessions.forEach((session, index) => {
    if (!sessionColors.has(session.activityId)) {
      sessionColors.set(session.activityId, getActivityColor(session.activityId, sessionColors.size))
    }
  })

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="280" viewBox="0 0 280 280">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="2"
        />
        
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />

        {todaySessions.map((session, index) => {
          if (!session.endTime) return null
          
          const color = sessionColors.get(session.activityId) || '#000000'
          const path = drawArc(
            new Date(session.startTime),
            new Date(session.endTime)
          )
          
          return (
            <g key={session.id}>
              <path
                d={path}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              <path
                d={path}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="0 1000"
                strokeDashoffset="-1"
              />
            </g>
          )
        })}

        {todaySessions.map((session) => {
          const startAngle = timeToAngle(new Date(session.startTime))
          const startRad = (startAngle * Math.PI) / 180
          const dotRadius = radius
          const x = center + dotRadius * Math.cos(startRad)
          const y = center + dotRadius * Math.sin(startRad)
          
          return (
            <circle
              key={`start-${session.id}`}
              cx={x}
              cy={y}
              r="4"
              fill="white"
              stroke={sessionColors.get(session.activityId) || '#000000'}
              strokeWidth="2"
            />
          )
        })}

        {todaySessions.map((session) => {
          if (!session.endTime) return null
          
          const endAngle = timeToAngle(new Date(session.endTime))
          const endRad = (endAngle * Math.PI) / 180
          const dotRadius = radius
          const x = center + dotRadius * Math.cos(endRad)
          const y = center + dotRadius * Math.sin(endRad)
          
          return (
            <circle
              key={`end-${session.id}`}
              cx={x}
              cy={y}
              r="4"
              fill={sessionColors.get(session.activityId) || '#000000'}
            />
          )
        })}

        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
          const angle = (hour / 24) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const labelRadius = radius + 18
          const x = center + labelRadius * Math.cos(rad)
          const y = center + labelRadius * Math.sin(rad)
          
          const displayHour = hour === 0 ? '24' : formatTimeLabel(hour)
          
          return (
            <text
              key={hour}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-600 font-light"
            >
              {`${displayHour}:00`}
            </text>
          )
        })}

        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
          const angle = (hour / 24) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const isMajor = hour % 3 === 0
          const tickLength = isMajor ? 8 : 4
          const x1 = center + (radius - tickLength) * Math.cos(rad)
          const y1 = center + (radius - tickLength) * Math.sin(rad)
          const x2 = center + radius * Math.cos(rad)
          const y2 = center + radius * Math.sin(rad)
          
          return (
            <line
              key={`tick-${hour}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMajor ? "#6B7280" : "#D1D5DB"}
              strokeWidth={isMajor ? "1.5" : "1"}
            />
          )
        })}
      </svg>

      {todaySessions.length > 0 ? (
        <div className="mt-6 space-y-2 w-full px-4">
          {todaySessions.map((session) => {
            const activity = activities.find(a => a.id === session.activityId)
            const startTime = format(new Date(session.startTime), 'HH:mm')
            const endTime = session.endTime ? format(new Date(session.endTime), 'HH:mm') : 'ongoing'
            const duration = session.endTime 
              ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
              : 0
            
            return (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sessionColors.get(session.activityId) || '#000000' }}
                  />
                  <span className="font-light">{activity?.name || 'Unknown'}</span>
                </div>
                <span className="text-gray-500 font-light">
                  {startTime} - {endTime} ({duration} min)
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 text-center text-gray-400 font-light text-sm">
          No activities recorded for this day
        </div>
      )}
    </div>
  )
}