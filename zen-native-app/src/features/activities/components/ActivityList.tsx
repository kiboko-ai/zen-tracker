import React from 'react'
import { View, StyleSheet } from 'react-native'
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import { Activity } from '../../../store/store'
import { ActivityItem } from './ActivityItem'

interface ActivityListProps {
  activities: Activity[]
  onActivityPress: (activity: Activity) => void
  onReorder?: (activities: Activity[]) => void
  onEdit?: (activity: Activity) => void
  onDelete?: (activity: Activity) => void
  isEditMode?: boolean
  todayTimes?: { [key: string]: number }
  isDraggable?: boolean
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onActivityPress,
  onReorder,
  onEdit,
  onDelete,
  isEditMode = false,
  todayTimes = {},
  isDraggable = false,
}) => {
  const renderItem = ({ item, drag, isActive }: RenderItemParams<Activity>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={isDraggable ? drag : undefined}
          disabled={!isDraggable && !isActive}
          activeOpacity={1}
        >
          <ActivityItem
            activity={item}
            onPress={() => onActivityPress(item)}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDelete?.(item)}
            isEditMode={isEditMode}
            todayTime={todayTimes[item.id]}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  if (isDraggable && onReorder) {
    return (
      <DraggableFlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => onReorder(data)}
        containerStyle={styles.container}
      />
    )
  }

  return (
    <View style={styles.container}>
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onPress={() => onActivityPress(activity)}
          onEdit={() => onEdit?.(activity)}
          onDelete={() => onDelete?.(activity)}
          isEditMode={isEditMode}
          todayTime={todayTimes[activity.id]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
})

import { TouchableOpacity } from 'react-native'