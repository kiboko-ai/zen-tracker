import React, { useState, useEffect, useMemo, useRef } from 'react'
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
import { AnalyticsService, eventNames } from '../services/AnalyticsService'

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
  const dragHandleAnimation = useRef(new Animated.Value(0)).current
  const contentAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dragHandleAnimation, {
        toValue: editMode ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: editMode ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [editMode])

  const handleAddActivity = () => {
    setNewActivityName('')
    setEditingId('new')
    setShowAddModal(true)
  }

  const handleSaveNewActivity = () => {
    if (newActivityName.trim()) {
      addActivity(newActivityName)
      // Log activity creation
      AnalyticsService.logEvent(eventNames.ACTIVITY_CREATE, {
        activity_name: newActivityName
      })
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
              // Log activity update
              AnalyticsService.logEvent(eventNames.ACTIVITY_UPDATE, {
                activity_name: text
              })
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
        { text: 'Remove', style: 'destructive', onPress: () => {
          const activity = activities.find(a => a.id === id)
          removeActivity(id)
          // Log activity deletion
          AnalyticsService.logEvent(eventNames.ACTIVITY_DELETE, {
            activity_name: activity?.name
          })
        }},
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
    return [...activities].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [activities])

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
      <ScaleDecorator activeScale={0.98}>
        <TouchableOpacity
          onPress={() => !editMode && handleStartActivity(item.id)}
          onLongPress={editMode ? drag : undefined}
          disabled={isActive}
          style={[
            styles.activityCard,
            isActive && styles.activityCardActive
          ]}
        >
          <Animated.View style={[
            styles.dragHandle,
            {
              opacity: dragHandleAnimation,
              transform: [{
                scaleX: dragHandleAnimation
              }]
            }
          ]}>
            <View style={styles.dragLine} />
            <View style={styles.dragLine} />
            <View style={styles.dragLine} />
          </Animated.View>
          <Animated.View style={[
            styles.activityContent,
            {
              transform: [{
                translateX: contentAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0]
                })
              }]
            }
          ]}>
            <Text style={styles.activityName}>{item.name}</Text>
            {todayTime && (
              <Text style={styles.activityTime}>
                {formatActivityTime(todayTime)} focused today
              </Text>
            )}
          </Animated.View>
          <View style={styles.activityActions}>
            <TouchableOpacity
              onPress={() => handleEditActivity(item.id, item.name)}
              style={[styles.editButton, !editMode && styles.hiddenButton]}
              disabled={!editMode}
            >
              <Text style={[styles.editButtonText, !editMode && styles.hiddenText]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRemoveActivity(item.id)}
              style={[styles.removeButton, !editMode && styles.hiddenButton]}
              disabled={!editMode}
            >
              <Text style={[styles.removeButtonText, !editMode && styles.hiddenText]}>−</Text>
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity 
            onPress={handleAddActivity} 
            style={[styles.addButton, editMode && styles.hiddenButton]}
            disabled={editMode}
          >
            <Text style={[styles.addButtonText, editMode && styles.hiddenText]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => editMode ? setEditMode(false) : setEditMode(true)}
            style={editMode ? styles.doneButton : styles.editModeButton}
          >
            <Text style={editMode ? styles.doneButtonText : styles.editModeButtonText}>
              {editMode ? 'done' : 'edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <DraggableFlatList
        data={sortedActivities}
        onDragEnd={({ data }) => {
          if (editMode) {
            const updatedActivities = data.map((activity, index) => ({
              ...activity,
              order: index
            }))
            reorderActivities(updatedActivities)
            // Log activity reordering
            AnalyticsService.logEvent(eventNames.ACTIVITY_REORDER, {
              activities_count: updatedActivities.length
            })
          }
        }}
        keyExtractor={(item) => item.id}
        renderItem={renderActivity}
        containerStyle={styles.listContainer}
        activationDistance={editMode ? 10 : 999999}
        showsVerticalScrollIndicator={false}
      />

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
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
    justifyContent: 'flex-end',
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
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  editModeButtonText: {
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scaleDecoratorWrapper: {
    // ScaleDecorator와 동일한 구조를 위한 래퍼
  },
  activityCard: {
    backgroundColor: 'black',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 68,
  },
  activityCardActive: {
    opacity: 0.9,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    width: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hiddenButton: {
    opacity: 0,
  },
  hiddenText: {
    opacity: 0,
  },
  dragHandle: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  dragLine: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 2,
    borderRadius: 1,
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