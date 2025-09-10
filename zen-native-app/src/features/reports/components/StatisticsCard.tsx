import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface StatisticsCardProps {
  title: string
  value: string
  subtitle?: string
  color?: string
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  color = '#007AFF',
}) => {
  return (
    <View style={[styles.container, { borderTopColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#C7C7CC',
  },
})