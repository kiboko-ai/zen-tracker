import { useMemo } from 'react'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  differenceInDays,
} from 'date-fns'
import { useStore } from '../../../store/store'
import { Session } from '../../../store/store'
import { DateRange } from '../components/DateRangePicker'

export const useReportData = (dateRange: DateRange, selectedDate: Date) => {
  const { sessions, activities } = useStore()

  const dateInterval = useMemo(() => {
    switch (dateRange) {
      case 'day':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        }
      case 'week':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        }
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        }
      case 'year':
        return {
          start: startOfYear(selectedDate),
          end: endOfYear(selectedDate),
        }
    }
  }, [dateRange, selectedDate])

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.startTime)
      return isWithinInterval(sessionDate, dateInterval)
    })
  }, [sessions, dateInterval])

  const statistics = useMemo(() => {
    const totalTime = filteredSessions.reduce((sum, session) => sum + session.duration, 0)
    const activeDays = new Set(
      filteredSessions.map((session) => 
        startOfDay(new Date(session.startTime)).toISOString()
      )
    ).size

    const totalDays = differenceInDays(dateInterval.end, dateInterval.start) + 1
    const averageTime = activeDays > 0 ? totalTime / activeDays : 0

    const activityStats = activities.map((activity) => {
      const activitySessions = filteredSessions.filter(
        (session) => session.activityId === activity.id
      )
      const activityTime = activitySessions.reduce(
        (sum, session) => sum + session.duration,
        0
      )
      return {
        ...activity,
        time: activityTime,
        percentage: totalTime > 0 ? (activityTime / totalTime) * 100 : 0,
        sessionCount: activitySessions.length,
      }
    }).filter(stat => stat.time > 0)
      .sort((a, b) => b.time - a.time)

    return {
      totalTime,
      activeDays,
      totalDays,
      averageTime,
      sessionCount: filteredSessions.length,
      activityStats,
    }
  }, [filteredSessions, activities, dateInterval])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  return {
    dateInterval,
    filteredSessions,
    statistics,
    formatTime,
  }
}