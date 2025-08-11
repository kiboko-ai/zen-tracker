import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, addDays, subDays } from 'date-fns'
import Svg, { Circle, Path, Text as SvgText, Line } from 'react-native-svg'
import { useStore } from '../store/store'
import { TimelineChart } from '../components/TimelineChart'
import { RingsChart } from '../components/RingsChart'

type TabType = 'daily' | 'weekly' | 'monthly' | 'yearly'

const { width } = Dimensions.get('window')

export default function ReportPage() {
  const navigation = useNavigation()
  const { sessions, activities } = useStore()
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [chartView, setChartView] = useState<'timeline' | 'rings'>('timeline')
  
  const now = selectedDate

  const getDateRange = (tab: TabType) => {
    switch (tab) {
      case 'daily':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'weekly':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) }
    }
  }

  const filteredSessions = useMemo(() => {
    const range = getDateRange(activeTab)
    return sessions.filter(session => 
      isWithinInterval(new Date(session.startTime), range)
    )
  }, [sessions, activeTab, selectedDate])

  const stats = useMemo(() => {
    const totalTime = filteredSessions.reduce((acc, session) => acc + session.duration, 0)
    const avgTimePerDay = totalTime / (activeTab === 'daily' ? 1 : activeTab === 'weekly' ? 7 : activeTab === 'monthly' ? 30 : 365)
    
    const activityStats = activities.map(activity => {
      const activitySessions = filteredSessions.filter(s => s.activityId === activity.id)
      const activityTime = activitySessions.reduce((acc, session) => acc + session.duration, 0)
      return {
        id: activity.id,
        name: activity.name,
        totalTime: activityTime,
        percentage: totalTime > 0 ? (activityTime / totalTime) * 100 : 0,
        avgTime: activitySessions.length > 0 ? activityTime / activitySessions.length : 0,
        count: activitySessions.length
      }
    }).filter(stat => stat.totalTime > 0)
      .sort((a, b) => b.totalTime - a.totalTime)

    const longestSession = filteredSessions.reduce((max, session) => 
      session.duration > (max?.duration || 0) ? session : max, 
      null as typeof filteredSessions[0] | null
    )

    return {
      totalTime,
      avgTimePerDay,
      activityStats,
      longestDuration: longestSession?.duration || 0,
      sessionCount: filteredSessions.length
    }
  }, [filteredSessions, activities, activeTab])

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours.toFixed(1)} hour`
    }
    return `${minutes} min`
  }

  const getDateLabel = () => {
    switch (activeTab) {
      case 'daily':
        return format(now, 'yyyy. MM. dd')
      case 'weekly':
        return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy. MM. dd')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MM.dd')}`
      case 'monthly':
        return format(now, 'yyyy. MM')
      case 'yearly':
        return format(now, 'yyyy')
    }
  }

  const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB']

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {(['daily', 'weekly', 'monthly', 'yearly'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'daily' && (
          <>
            <View style={styles.dateNavigation}>
              <TouchableOpacity
                onPress={() => setSelectedDate(subDays(selectedDate, 1))}
                style={styles.dateNavButton}
              >
                <Text style={styles.dateNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel}>
                {format(selectedDate, 'yyyy. MM. dd')}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(addDays(selectedDate, 1))}
                style={styles.dateNavButton}
                disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
              >
                <Text style={[
                  styles.dateNavText,
                  format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && styles.disabledText
                ]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartToggle}>
              <TouchableOpacity
                onPress={() => setChartView('timeline')}
                style={[styles.toggleButton, chartView === 'timeline' && styles.activeToggle]}
              >
                <Text style={[styles.toggleText, chartView === 'timeline' && styles.activeToggleText]}>
                  Timeline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartView('rings')}
                style={[styles.toggleButton, chartView === 'rings' && styles.activeToggle]}
              >
                <Text style={[styles.toggleText, chartView === 'rings' && styles.activeToggleText]}>
                  Rings
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              {chartView === 'timeline' ? (
                <TimelineChart activities={activities} date={selectedDate} />
              ) : (
                <RingsChart activities={activities} date={selectedDate} />
              )}
            </View>
          </>
        )}

        {activeTab !== 'daily' && (
          <Text style={styles.periodLabel}>{getDateLabel()}</Text>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. focus time per day</Text>
            <Text style={styles.statValue}>{formatDuration(stats.avgTimePerDay)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total focus time</Text>
            <Text style={styles.statValue}>{formatDuration(stats.totalTime)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. focus time per activity</Text>
            <Text style={styles.statValue}>
              {stats.activityStats.length > 0 
                ? formatDuration(stats.totalTime / stats.activityStats.length)
                : '0 min'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Longest total focus time</Text>
            <Text style={styles.statValue}>{formatDuration(stats.longestDuration)}</Text>
          </View>
        </View>

        {stats.activityStats.length > 0 ? (
          <View style={styles.activitiesSection}>
            {stats.activityStats.map((stat, index) => (
              <View key={stat.id} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <View style={[styles.activityDot, { backgroundColor: COLORS[index % COLORS.length] }]} />
                  <Text style={styles.activityName}>{stat.name}</Text>
                </View>
                <Text style={styles.activityTime}>
                  {formatDuration(stat.totalTime)} / {formatDuration(stat.avgTime)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activities recorded yet</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.startTrackingButton}
            >
              <Text style={styles.startTrackingText}>Start Tracking</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    padding: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'black',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateNavButton: {
    padding: 8,
  },
  dateNavText: {
    fontSize: 24,
    color: '#6B7280',
  },
  disabledText: {
    color: '#D1D5DB',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '300',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '300',
  },
  activitiesSection: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '300',
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  startTrackingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'black',
    borderRadius: 8,
  },
  startTrackingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '300',
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
    padding: 4,
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: 'black',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '300',
    color: '#6B7280',
  },
  activeToggleText: {
    color: 'white',
  },
  chartContainer: {
    marginBottom: 24,
  },
})