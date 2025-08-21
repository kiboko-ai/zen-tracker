import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native'
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')

interface OnboardingTutorialProps {
  visible: boolean
  onComplete: () => void
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ visible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const renderIcon = (step: number) => {
    switch (step) {
      case 0: // Timer icon
        return (
          <Svg width="80" height="80" viewBox="0 0 80 80">
            <Circle cx="40" cy="40" r="35" stroke="black" strokeWidth="2" fill="none" />
            <Line x1="40" y1="40" x2="40" y2="20" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <Line x1="40" y1="40" x2="55" y2="45" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <Circle cx="40" cy="40" r="3" fill="black" />
          </Svg>
        )
      case 1: // Plus icon
        return (
          <Svg width="80" height="80" viewBox="0 0 80 80">
            <Circle cx="40" cy="40" r="35" stroke="black" strokeWidth="2" fill="none" />
            <Line x1="40" y1="25" x2="40" y2="55" stroke="black" strokeWidth="3" strokeLinecap="round" />
            <Line x1="25" y1="40" x2="55" y2="40" stroke="black" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        )
      case 2: // Target icon
        return (
          <Svg width="80" height="80" viewBox="0 0 80 80">
            <Circle cx="40" cy="40" r="35" stroke="black" strokeWidth="2" fill="none" />
            <Circle cx="40" cy="40" r="25" stroke="black" strokeWidth="2" fill="none" />
            <Circle cx="40" cy="40" r="15" stroke="black" strokeWidth="2" fill="none" />
            <Circle cx="40" cy="40" r="5" fill="black" />
          </Svg>
        )
      case 3: // Chart icon
        return (
          <Svg width="80" height="80" viewBox="0 0 80 80">
            <Rect x="20" y="50" width="10" height="15" fill="black" />
            <Rect x="35" y="35" width="10" height="30" fill="black" />
            <Rect x="50" y="25" width="10" height="40" fill="black" />
          </Svg>
        )
      default:
        return null
    }
  }

  const steps = [
    {
      title: 'Welcome to Zen',
      description: 'A minimalist focus timer\nfor deep work',
    },
    {
      title: 'Create Activities',
      description: 'Track different types of work\nlike Study, Code, or Meditate',
    },
    {
      title: 'Set Your Target',
      description: 'Choose your focus duration\nor go unlimited with ∞',
    },
    {
      title: 'Track Progress',
      description: 'View your focus history\nand build consistency',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    await AsyncStorage.setItem('hasSeenTutorial', 'true')
    onComplete()
  }

  const currentStepData = steps[currentStep]

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.illustrationContainer}>
            {renderIcon(currentStep)}
          </View>

          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          <View style={styles.pagination}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  illustrationContainer: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#000000',
  },
  nextButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
  },
})