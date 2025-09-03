import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

interface AppState {
  activities: Activity[]
  sessions: Session[]
  currentSession: Session | null
  isFirstTime: boolean
  selectedActivities: string[]
  
  addActivity: (name: string) => void
  removeActivity: (id: string) => void
  updateActivity: (id: string, updates: Partial<Activity>) => void
  reorderActivities: (activities: Activity[]) => void
  
  startSession: (activityId: string, targetDuration?: number) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  
  setFirstTime: (value: boolean) => void
  setSelectedActivities: (activities: string[]) => void
  
  // Import methods
  importData: (data: {
    activities: Activity[]
    sessions: Session[]
    isFirstTime?: boolean
    selectedActivities?: string[]
  }, mode: 'replace' | 'merge' | 'append') => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activities: [],
      sessions: [],
      currentSession: null,
      isFirstTime: true,
      selectedActivities: [],
      
      addActivity: (name) => {
        const newActivity: Activity = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          totalTime: 0,
          lastUsed: new Date(),
          order: get().activities.length
        }
        set((state) => ({
          activities: [newActivity, ...state.activities]
        }))
      },
      
      removeActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter(a => a.id !== id),
          selectedActivities: state.selectedActivities.filter(a => a !== id)
        }))
      },
      
      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map(a => 
            a.id === id ? { ...a, ...updates } : a
          )
        }))
      },
      
      reorderActivities: (activities) => {
        set({ activities })
      },
      
      startSession: (activityId, targetDuration) => {
        const newSession: Session = {
          id: Date.now().toString(),
          activityId,
          startTime: new Date(),
          duration: 0,
          pauses: [],
          targetDuration,
        }
        set({ currentSession: newSession })
      },
      
      pauseSession: () => {
        set((state) => {
          if (!state.currentSession) return state
          return {
            currentSession: {
              ...state.currentSession,
              pauses: [...state.currentSession.pauses, { start: new Date() }]
            }
          }
        })
      },
      
      resumeSession: () => {
        set((state) => {
          if (!state.currentSession) return state
          const pauses = [...state.currentSession.pauses]
          const lastPause = pauses[pauses.length - 1]
          if (lastPause && !lastPause.end) {
            lastPause.end = new Date()
          }
          return {
            currentSession: {
              ...state.currentSession,
              pauses
            }
          }
        })
      },
      
      endSession: () => {
        const session = get().currentSession
        if (!session) return
        
        const endTime = new Date()
        const completedSession = {
          ...session,
          endTime,
          duration: endTime.getTime() - session.startTime.getTime()
        }
        
        set((state) => ({
          sessions: [...state.sessions, completedSession],
          currentSession: null,
          activities: state.activities.map(a => 
            a.id === session.activityId 
              ? { ...a, totalTime: a.totalTime + completedSession.duration, lastUsed: endTime }
              : a
          )
        }))
      },
      
      setFirstTime: (value) => set({ isFirstTime: value }),
      setSelectedActivities: (activities) => set({ selectedActivities: activities }),
      
      importData: (data, mode) => {
        const currentState = get()
        
        switch (mode) {
          case 'replace':
            // Replace all data
            set({
              activities: data.activities,
              sessions: data.sessions,
              isFirstTime: data.isFirstTime ?? false,
              selectedActivities: data.selectedActivities ?? [],
              currentSession: null
            })
            break
            
          case 'merge':
            // Merge with existing data, combining statistics for same activity names
            const existingActivityMap = new Map(currentState.activities.map(a => [a.name.toLowerCase(), a]))
            const existingSessionIds = new Set(currentState.sessions.map(s => s.id))
            
            // Process imported activities
            const mergedActivities = [...currentState.activities]
            const activityIdMapping = new Map<string, string>() // oldId -> newId
            
            data.activities.forEach(importedActivity => {
              const existingActivity = existingActivityMap.get(importedActivity.name.toLowerCase())
              
              if (existingActivity) {
                // Map the imported activity ID to existing activity ID
                activityIdMapping.set(importedActivity.id, existingActivity.id)
              } else {
                // Add new activity
                mergedActivities.push(importedActivity)
                existingActivityMap.set(importedActivity.name.toLowerCase(), importedActivity)
                activityIdMapping.set(importedActivity.id, importedActivity.id)
              }
            })
            
            // Process sessions with updated activity IDs
            const newSessions = data.sessions
              .filter(s => !existingSessionIds.has(s.id))
              .map(session => ({
                ...session,
                activityId: activityIdMapping.get(session.activityId) || session.activityId
              }))
            
            const allSessions = [...currentState.sessions, ...newSessions]
            
            // Recalculate totalTime for all activities based on actual sessions
            const updatedActivities = mergedActivities.map(activity => {
              const activitySessions = allSessions.filter(s => s.activityId === activity.id)
              const calculatedTotalTime = activitySessions.reduce((sum, session) => sum + session.duration, 0)
              const latestSession = activitySessions.reduce((latest, session) => 
                new Date(session.startTime) > new Date(latest?.startTime || 0) ? session : latest, null)
              
              return {
                ...activity,
                totalTime: calculatedTotalTime,
                lastUsed: latestSession ? new Date(latestSession.startTime) : activity.lastUsed
              }
            })
            
            set({
              activities: updatedActivities,
              sessions: allSessions,
              isFirstTime: false,
              selectedActivities: [...new Set([...currentState.selectedActivities, ...(data.selectedActivities ?? [])])]
            })
            break
            
          case 'append':
            // Add all entries, combining statistics for duplicate names
            const timestamp = Date.now()
            const currentActivityMap = new Map(currentState.activities.map(a => [a.name.toLowerCase(), a]))
            
            const appendActivities = [...currentState.activities]
            const appendActivityIdMapping = new Map<string, string>()
            
            data.activities.forEach((importedActivity, index) => {
              const existingActivity = currentActivityMap.get(importedActivity.name.toLowerCase())
              
              if (existingActivity) {
                // Map to existing activity
                appendActivityIdMapping.set(importedActivity.id, existingActivity.id)
              } else {
                // Add as new activity with new ID
                const newActivity = {
                  ...importedActivity,
                  id: `${importedActivity.id}-imported-${timestamp}-${index}`
                }
                appendActivities.push(newActivity)
                currentActivityMap.set(importedActivity.name.toLowerCase(), newActivity)
                appendActivityIdMapping.set(importedActivity.id, newActivity.id)
              }
            })
            
            const appendedSessions = data.sessions.map((s, index) => ({
              ...s,
              id: `${s.id}-imported-${timestamp}-${index}`,
              activityId: appendActivityIdMapping.get(s.activityId) || s.activityId
            }))
            
            const allAppendSessions = [...currentState.sessions, ...appendedSessions]
            
            // Recalculate totalTime for all activities based on actual sessions
            const finalAppendActivities = appendActivities.map(activity => {
              const activitySessions = allAppendSessions.filter(s => s.activityId === activity.id)
              const calculatedTotalTime = activitySessions.reduce((sum, session) => sum + session.duration, 0)
              const latestSession = activitySessions.reduce((latest, session) => 
                new Date(session.startTime) > new Date(latest?.startTime || 0) ? session : latest, null)
              
              return {
                ...activity,
                totalTime: calculatedTotalTime,
                lastUsed: latestSession ? new Date(latestSession.startTime) : activity.lastUsed
              }
            })
            
            set({
              activities: finalAppendActivities,
              sessions: allAppendSessions,
              isFirstTime: false
            })
            break
        }
      },
    }),
    {
      name: 'zen-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)