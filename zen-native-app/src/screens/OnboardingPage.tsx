import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useStore } from '../store/store'
import { RootStackParamList } from '../../App'
import { AnalyticsService, eventNames } from '../services/AnalyticsService'

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>

const defaultActivities = ['Read', 'Meditate', 'Write', 'Exercise', 'Study', 'Work']

export default function OnboardingPage() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>()
  const { addActivity, setFirstTime, setSelectedActivities } = useStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [customActivity, setCustomActivity] = useState('')
  
  // Log onboarding start when component mounts
  React.useEffect(() => {
    AnalyticsService.logEvent(eventNames.ONBOARDING_START)
  }, [])

  const handleToggleActivity = (activity: string) => {
    if (selectedItems.includes(activity)) {
      setSelectedItems(selectedItems.filter(item => item !== activity))
    } else {
      setSelectedItems([...selectedItems, activity])
    }
  }

  const handleAddCustom = () => {
    if (customActivity.trim()) {
      handleToggleActivity(customActivity.trim())
      setCustomActivity('')
    }
  }

  const handleComplete = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Select Activities', 'Please select at least one activity to continue.')
      return
    }

    selectedItems.forEach(activity => {
      addActivity(activity)
    })
    
    // Log onboarding completion
    AnalyticsService.logEvent(eventNames.ONBOARDING_COMPLETE, {
      activities_selected: selectedItems.length,
      activities: selectedItems.join(',')
    })
    
    setSelectedActivities(selectedItems)
    setFirstTime(false)
    navigation.replace('Home')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Zen</Text>
        <Text style={styles.subtitle}>
          Choose activities you want to focus on
        </Text>

        <View style={styles.activitiesGrid}>
          {defaultActivities.map(activity => (
            <TouchableOpacity
              key={activity}
              onPress={() => handleToggleActivity(activity)}
              style={[
                styles.activityCard,
                selectedItems.includes(activity) && styles.selectedCard
              ]}
            >
              <Text style={[
                styles.activityText,
                selectedItems.includes(activity) && styles.selectedText
              ]}>
                {activity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customSection}>
          <Text style={styles.customLabel}>Add your own</Text>
          <View style={styles.customInputContainer}>
            <TextInput
              value={customActivity}
              onChangeText={setCustomActivity}
              placeholder="Type activity name"
              style={styles.customInput}
              onSubmitEditing={handleAddCustom}
            />
            <TouchableOpacity
              onPress={handleAddCustom}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedItems.filter(item => !defaultActivities.includes(item)).map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => handleToggleActivity(item)}
            style={[styles.activityCard, styles.selectedCard, styles.customCard]}
          >
            <Text style={[styles.activityText, styles.selectedText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleComplete}
          style={[
            styles.continueButton,
            selectedItems.length === 0 && styles.disabledButton
          ]}
          disabled={selectedItems.length === 0}
        >
          <Text style={styles.continueButtonText}>
            Continue ({selectedItems.length} selected)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
    marginBottom: 32,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  activityCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedCard: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  activityText: {
    fontSize: 16,
    fontWeight: '300',
  },
  selectedText: {
    color: 'white',
  },
  customSection: {
    marginBottom: 16,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
    marginBottom: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  customCard: {
    marginBottom: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    backgroundColor: 'black',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
})