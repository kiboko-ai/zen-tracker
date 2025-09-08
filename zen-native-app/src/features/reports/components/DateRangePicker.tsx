import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'

export type DateRange = 'day' | 'week' | 'month' | 'year'

interface DateRangePickerProps {
  selectedRange: DateRange
  onRangeChange: (range: DateRange) => void
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges: { value: DateRange; label: string }[] = [
    { value: 'day', label: '일간' },
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'year', label: '연간' },
  ]

  return (
    <View style={styles.container}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range.value}
          style={[
            styles.button,
            selectedRange === range.value && styles.selectedButton,
          ]}
          onPress={() => onRangeChange(range.value)}
        >
          <Text
            style={[
              styles.buttonText,
              selectedRange === range.value && styles.selectedButtonText,
            ]}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  selectedButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
})