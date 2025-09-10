import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { Activity } from '../../../store/store'

interface ActivityItemProps {
  activity: Activity
  onPress: () => void
  onEdit?: () => void
  onDelete?: () => void
  isEditMode?: boolean
  todayTime?: number
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  onPress,
  onEdit,
  onDelete,
  isEditMode = false,
  todayTime = 0,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: activity.color || '#007AFF' }]}
      onPress={onPress}
      disabled={isEditMode}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{activity.name}</Text>
        <View style={styles.info}>
          {todayTime > 0 && (
            <Text style={styles.todayTime}>오늘: {formatTime(todayTime)}</Text>
          )}
          <Text style={styles.totalTime}>
            전체: {formatTime(activity.totalTime)}
          </Text>
        </View>
      </View>
      
      {isEditMode && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    gap: 16,
  },
  todayTime: {
    fontSize: 14,
    color: '#007AFF',
  },
  totalTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
})