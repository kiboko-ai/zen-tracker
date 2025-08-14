import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import { useStore } from '../store/store'
import { RootStackParamList } from '../../App'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { activities, sessions, addActivity, removeActivity, updateActivity, reorderActivities } = useStore()
  const [editMode, setEditMode] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAddActivity = () => {
    setNewActivityName('')
    setEditingId('new')
    setShowAddModal(true)
  }

  const handleSaveNewActivity = () => {
    if (newActivityName.trim()) {
      addActivity(newActivityName)
      setNewActivityName('')
      setShowAddModal(false)
      setEditingId(null)
    }
  }

  const handleEditActivity = (id: string, currentName: string) => {
    Alert.prompt(
      'Edit Activity',
      'Enter new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            if (text?.trim()) {
              updateActivity(id, { name: text })
            }
          },
        },
      ],
      'plain-text',
      currentName
    )
  }

  const handleRemoveActivity = (id: string) => {
    Alert.alert(
      'Remove Activity',
      'Are you sure you want to remove this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeActivity(id) },
      ]
    )
  }

  const handleStartActivity = (activityId: string) => {
    navigation.navigate('Timer', { id: activityId })
  }

  const todayActivityTimes = useMemo(() => {
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    
    const timesMap = new Map<string, number>()
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.startTime)
      if (isWithinInterval(sessionDate, { start: todayStart, end: todayEnd })) {
        const currentTime = timesMap.get(session.activityId) || 0
        timesMap.set(session.activityId, currentTime + session.duration)
      }
    })
    
    return timesMap
  }, [sessions])

  const sortedActivities = useMemo(() => {
    if (editMode) {
      return [...activities].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    } else {
      const hourNow = currentTime.getHours()
      return [...activities].sort((a, b) => {
        const getActivityScore = (activity: typeof a) => {
          const lastUsedHour = new Date(activity.lastUsed).getHours()
          const hourDiff = Math.abs(hourNow - lastUsedHour)
          return hourDiff
        }
        return getActivityScore(a) - getActivityScore(b)
      })
    }
  }, [activities, editMode, currentTime])

  const formatActivityTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const renderActivity = ({ item, drag, isActive }: RenderItemParams<typeof activities[0]>) => {
    const todayTime = todayActivityTimes.get(item.id)
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPress={() => !editMode && handleStartActivity(item.id)}
          onLongPress={editMode ? drag : undefined}
          disabled={isActive}
          style={[
            styles.activityCard,
            isActive && styles.activityCardActive
          ]}
        >
          <View style={styles.activityContent}>
            <Text style={styles.activityName}>{item.name}</Text>
            {todayTime && (
              <Text style={styles.activityTime}>
                {formatActivityTime(todayTime)} focused today
              </Text>
            )}
          </View>
          {editMode && (
            <View style={styles.activityActions}>
              <TouchableOpacity
                onPress={() => handleEditActivity(item.id, item.name)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveActivity(item.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>−</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.dateText}>{format(currentTime, 'yyyy. MM. dd')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Report')}
          style={styles.reportButton}
        >
          <View style={styles.reportIcon}>
            <View style={[styles.reportBar, { opacity: 0.8, height: 16 }]} />
            <View style={[styles.reportBar, { opacity: 0.6, height: 8 }]} />
            <View style={[styles.reportBar, { opacity: 0.4, height: 8 }]} />
            <View style={[styles.reportBar, { opacity: 0.2, height: 8 }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Choose Your Zen</Text>
        <View style={styles.actionButtons}>
          {!editMode ? (
            <>
              <TouchableOpacity onPress={handleAddActivity} style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditMode(true)}
                style={styles.editModeButton}
              >
                <Text style={styles.editModeButtonText}>edit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setEditMode(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {editMode ? (
        <DraggableFlatList
          data={sortedActivities}
          onDragEnd={({ data }) => {
            const updatedActivities = data.map((activity, index) => ({
              ...activity,
              order: index
            }))
            reorderActivities(updatedActivities)
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          containerStyle={styles.listContainer}
        />
      ) : (
        <ScrollView style={styles.listContainer}>
          {sortedActivities.map((activity) => {
            const todayTime = todayActivityTimes.get(activity.id)
            return (
              <TouchableOpacity
                key={activity.id}
                onPress={() => handleStartActivity(activity.id)}
                style={styles.activityCard}
              >
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  {todayTime && (
                    <Text style={styles.activityTime}>
                      {formatActivityTime(todayTime)} focused today
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {showAddModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => {
              setShowAddModal(false)
              setNewActivityName('')
            }}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddModal(false)
                  setNewActivityName('')
                }}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
              <TextInput
                value={newActivityName}
                onChangeText={setNewActivityName}
                placeholder="name your Zen"
                style={styles.modalInput}
                autoFocus
                onSubmitEditing={handleSaveNewActivity}
              />
              <TouchableOpacity
                onPress={handleSaveNewActivity}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 32,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '200',
    color: '#000',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
  },
  reportButton: {
    padding: 8,
  },
  reportIcon: {
    width: 24,
    height: 24,
    justifyContent: 'space-between',
  },
  reportBar: {
    backgroundColor: 'black',
    width: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '300',
  },
  editModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editModeButtonText: {
    fontSize: 14,
    fontWeight: '300',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'black',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: 'white',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  activityCard: {
    backgroundColor: 'black',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCardActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '300',
    color: 'white',
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '200',
    color: '#9CA3AF',
    marginTop: 4,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: '300',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
})