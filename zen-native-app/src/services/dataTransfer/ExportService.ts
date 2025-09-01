import { format as formatDate } from 'date-fns'
import { Activity, Session } from '../../store/store'

export interface ExportData {
  version: string
  exportDate: string
  deviceInfo: {
    platform: string
    appVersion: string
  }
  data: {
    activities: Activity[]
    sessions: Session[]
    currentSession: Session | null
    isFirstTime: boolean
    selectedActivities: string[]
  }
  statistics: {
    totalActivities: number
    totalSessions: number
    totalFocusTime: number
    averageSessionDuration: number
    mostUsedActivity: string | null
    lastActivityDate: string | null
  }
}

export class ExportService {
  private static APP_VERSION = '1.0.4'

  static prepareExportData(
    activities: Activity[],
    sessions: Session[],
    currentSession: Session | null,
    isFirstTime: boolean,
    selectedActivities: string[]
  ): ExportData {
    // Calculate statistics
    const totalFocusTime = sessions.reduce((acc, session) => acc + session.duration, 0)
    const averageSessionDuration = sessions.length > 0 ? totalFocusTime / sessions.length : 0
    
    // Find most used activity
    const activityUsage = activities.map(activity => {
      const activitySessions = sessions.filter(s => s.activityId === activity.id)
      const totalTime = activitySessions.reduce((acc, s) => acc + s.duration, 0)
      return { name: activity.name, totalTime }
    }).sort((a, b) => b.totalTime - a.totalTime)
    
    const mostUsedActivity = activityUsage.length > 0 ? activityUsage[0].name : null
    
    // Find last activity date
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    const lastActivityDate = sortedSessions.length > 0 
      ? sortedSessions[0].startTime.toString() 
      : null

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      deviceInfo: {
        platform: 'mobile', // Will be updated with actual platform
        appVersion: this.APP_VERSION
      },
      data: {
        activities,
        sessions,
        currentSession,
        isFirstTime,
        selectedActivities
      },
      statistics: {
        totalActivities: activities.length,
        totalSessions: sessions.length,
        totalFocusTime,
        averageSessionDuration,
        mostUsedActivity,
        lastActivityDate
      }
    }
  }

  static exportToJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2)
  }

  static exportToCSV(activities: Activity[], sessions: Session[]): string {
    const headers = ['Activity Name', 'Total Time (minutes)', 'Sessions Count', 'Last Used', 'Average Session (minutes)']
    
    const rows = activities.map(activity => {
      const activitySessions = sessions.filter(s => s.activityId === activity.id)
      const totalTime = activity.totalTime / 60000 // Convert to minutes
      const sessionsCount = activitySessions.length
      const avgSession = sessionsCount > 0 ? totalTime / sessionsCount : 0
      
      return [
        activity.name,
        Math.round(totalTime).toString(),
        sessionsCount.toString(),
        activity.lastUsed ? formatDate(new Date(activity.lastUsed), 'yyyy-MM-dd HH:mm') : '',
        Math.round(avgSession).toString()
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return csvContent
  }

  static generateFileName(fileFormat: 'json' | 'csv', sessions: Session[]): string {
    // Find the date range of sessions
    if (sessions.length > 0) {
      const sessionDates = sessions.map(s => new Date(s.startTime).getTime())
      const oldestDate = new Date(Math.min(...sessionDates))
      const newestDate = new Date(Math.max(...sessionDates))
      
      // Check if all sessions are in the same month
      const oldestYear = oldestDate.getFullYear()
      const newestYear = newestDate.getFullYear()
      const oldestMonth = oldestDate.getMonth()
      const newestMonth = newestDate.getMonth()
      
      if (oldestYear === newestYear && oldestMonth === newestMonth) {
        // All data in same month: zen_202501.json
        const yearMonth = formatDate(oldestDate, 'yyyyMM')
        return `zen_${yearMonth}.${fileFormat}`
      } else if (oldestYear === newestYear) {
        // Same year, different months: zen_2025_01-03.json
        const year = formatDate(oldestDate, 'yyyy')
        const startMonth = formatDate(oldestDate, 'MM')
        const endMonth = formatDate(newestDate, 'MM')
        return `zen_${year}_${startMonth}-${endMonth}.${fileFormat}`
      } else {
        // Multiple years: zen_202412-202503.json
        const startYearMonth = formatDate(oldestDate, 'yyyyMM')
        const endYearMonth = formatDate(newestDate, 'yyyyMM')
        return `zen_${startYearMonth}-${endYearMonth}.${fileFormat}`
      }
    } else {
      // No sessions: use current date
      const currentYearMonth = formatDate(new Date(), 'yyyyMM')
      return `zen_${currentYearMonth}_empty.${fileFormat}`
    }
  }
}