import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { useStore } from '../../../store/store'
import { Activity } from '../../../store/store'

export const useActivityManager = () => {
  const {
    activities,
    addActivity,
    removeActivity,
    updateActivity,
    reorderActivities,
  } = useStore()
  
  const [editMode, setEditMode] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const handleAddActivity = useCallback((name: string) => {
    if (name.trim()) {
      addActivity(name.trim())
      return true
    }
    return false
  }, [addActivity])

  const handleEditActivity = useCallback((activity: Activity, newName: string) => {
    if (newName.trim() && newName !== activity.name) {
      updateActivity(activity.id, { name: newName.trim() })
      return true
    }
    return false
  }, [updateActivity])

  const handleDeleteActivity = useCallback((activity: Activity) => {
    Alert.alert(
      '활동 삭제',
      `"${activity.name}"을(를) 삭제하시겠습니까? 모든 기록이 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeActivity(activity.id),
        },
      ]
    )
  }, [removeActivity])

  const handleReorderActivities = useCallback((newOrder: Activity[]) => {
    const orderedActivities = newOrder.map((activity, index) => ({
      ...activity,
      order: index,
    }))
    reorderActivities(orderedActivities)
  }, [reorderActivities])

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev)
    if (editingActivity) {
      setEditingActivity(null)
    }
  }, [editingActivity])

  const startEditing = useCallback((activity: Activity) => {
    setEditingActivity(activity)
  }, [])

  const stopEditing = useCallback(() => {
    setEditingActivity(null)
  }, [])

  return {
    activities,
    editMode,
    editingActivity,
    handleAddActivity,
    handleEditActivity,
    handleDeleteActivity,
    handleReorderActivities,
    toggleEditMode,
    startEditing,
    stopEditing,
  }
}