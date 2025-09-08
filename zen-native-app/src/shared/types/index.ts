export interface Activity {
  id: string
  name: string
  totalTime: number
  lastUsed: Date
  color?: string
  order?: number
  sessions?: Session[]
  lastTargetHours?: number
  lastTargetMinutes?: number
}

export interface Session {
  id: string
  activityId: string
  startTime: Date
  endTime?: Date
  duration: number
  pauses: Array<{ start: Date; end?: Date }>
  targetDuration?: number
}

export interface AppState {
  activities: Activity[]
  sessions: Session[]
  currentSession: Session | null
  isFirstTime: boolean
  selectedActivities: string[]
  lastDailyReminderCancelDate: string | null
}