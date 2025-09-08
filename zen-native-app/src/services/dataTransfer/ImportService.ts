import { Activity, Session } from '../../store/store'

export interface ImportOptions {
  mode: 'replace' | 'merge' | 'append'
}

export interface ImportResult {
  success: boolean
  activitiesImported: number
  sessionsImported: number
  error?: string
  data?: {
    activities: Activity[]
    sessions: Session[]
    isFirstTime?: boolean
    selectedActivities?: string[]
  }
}

export class ImportService {
  static validateImportData(data: any): boolean {
    // Check if it's valid export data structure
    if (!data || typeof data !== 'object') return false
    
    // Check required fields
    if (!data.version || !data.data) return false
    
    // Check data structure
    const { data: importData } = data
    if (!Array.isArray(importData.activities)) return false
    if (!Array.isArray(importData.sessions)) return false
    if (typeof importData.isFirstTime !== 'boolean') return false
    if (!Array.isArray(importData.selectedActivities)) return false
    
    // Validate activity structure
    for (const activity of importData.activities) {
      if (!activity.id || !activity.name || typeof activity.totalTime !== 'number') {
        return false
      }
    }
    
    // Validate session structure
    for (const session of importData.sessions) {
      if (!session.id || !session.activityId || !session.startTime || typeof session.duration !== 'number') {
        return false
      }
    }
    
    return true
  }
  
  static parseCSV(csvContent: string): { activities: Activity[], sessions: Session[] } | null {
    try {
      const lines = csvContent.split('\n')
      if (lines.length < 2) return null
      
      // Skip header
      const dataLines = lines.slice(1).filter(line => line.trim())
      
      const activities: Activity[] = []
      const sessions: Session[] = []
      
      for (const line of dataLines) {
        const cells = line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
        if (cells.length < 5) continue
        
        const [name, totalTimeStr, sessionsCountStr, lastUsedStr, avgSessionStr] = cells
        const totalTime = parseInt(totalTimeStr) * 60000 // Convert minutes to milliseconds
        
        const activity: Activity = {
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          totalTime,
          lastUsed: lastUsedStr ? new Date(lastUsedStr) : new Date(),
          order: activities.length
        }
        
        activities.push(activity)
      }
      
      return { activities, sessions }
    } catch (error) {
      console.error('CSV parsing failed:', error)
      return null
    }
  }
  
  static async importData(
    jsonString: string,
    currentActivities: Activity[],
    currentSessions: Session[],
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonString)
      
      if (!this.validateImportData(data)) {
        return {
          success: false,
          activitiesImported: 0,
          sessionsImported: 0,
          error: 'Invalid data format'
        }
      }
      
      const importedData = data.data
      
      // Count imported items based on mode
      let activitiesImported = 0
      let sessionsImported = 0
      
      switch (options.mode) {
        case 'replace':
          activitiesImported = importedData.activities.length
          sessionsImported = importedData.sessions.length
          break
          
        case 'merge':
          const existingActivityNames = new Set(currentActivities.map(a => a.name.toLowerCase()))
          const existingSessionIds = new Set(currentSessions.map(s => s.id))
          
          // Count new activities (those that don't exist) and merged activities (those that do exist)
          const newActivities = importedData.activities.filter((a: Activity) => !existingActivityNames.has(a.name.toLowerCase()))
          const mergedActivities = importedData.activities.filter((a: Activity) => existingActivityNames.has(a.name.toLowerCase()))
          
          activitiesImported = newActivities.length + mergedActivities.length
          sessionsImported = importedData.sessions.filter((s: Session) => !existingSessionIds.has(s.id)).length
          break
          
        case 'append':
          // All activities are processed (either added new or merged with existing)
          activitiesImported = importedData.activities.length
          sessionsImported = importedData.sessions.length
          break
      }
      
      return {
        success: true,
        activitiesImported,
        sessionsImported,
        data: {
          activities: importedData.activities,
          sessions: importedData.sessions,
          isFirstTime: importedData.isFirstTime,
          selectedActivities: importedData.selectedActivities
        }
      }
    } catch (error) {
      return {
        success: false,
        activitiesImported: 0,
        sessionsImported: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}