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
            // Merge with existing data, avoiding duplicates
            const existingActivityIds = new Set(currentState.activities.map(a => a.id))
            const existingSessionIds = new Set(currentState.sessions.map(s => s.id))
            
            const newActivities = data.activities.filter(a => !existingActivityIds.has(a.id))
            const newSessions = data.sessions.filter(s => !existingSessionIds.has(s.id))
            
            set({
              activities: [...currentState.activities, ...newActivities],
              sessions: [...currentState.sessions, ...newSessions],
              isFirstTime: false,
              selectedActivities: [...new Set([...currentState.selectedActivities, ...(data.selectedActivities ?? [])])]
            })
            break
            
          case 'append':
            // Add all as new entries with new IDs
            const timestamp = Date.now()
            const appendedActivities = data.activities.map((a, index) => ({
              ...a,
              id: `${a.id}-imported-${timestamp}-${index}`
            }))
            
            // Create ID mapping for sessions
            const activityIdMap = new Map<string, string>()
            data.activities.forEach((a, i) => {
              activityIdMap.set(a.id, appendedActivities[i].id)
            })
            
            const appendedSessions = data.sessions.map((s, index) => ({
              ...s,
              id: `${s.id}-imported-${timestamp}-${index}`,
              activityId: activityIdMap.get(s.activityId) || s.activityId
            }))
            
            set({
              activities: [...currentState.activities, ...appendedActivities],
              sessions: [...currentState.sessions, ...appendedSessions],
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