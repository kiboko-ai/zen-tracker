import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Share,
  ActionSheetIOS,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, eachDayOfInterval, getDay, getDaysInMonth, getMonth } from 'date-fns'
import Svg, { Circle, Path, Text as SvgText, Line, Rect } from 'react-native-svg'
import { useStore } from '../store/store'
import { TimelineChart } from '../components/TimelineChart'
import { RingsChart } from '../components/RingsChart'
import { getActivityColor } from '../utils/activityColors'
import { ExportService } from '../services/dataTransfer/ExportService'
import { ImportService } from '../services/dataTransfer/ImportService'
import * as DocumentPicker from 'expo-document-picker'
import RNFS from 'react-native-fs'
import { AnalyticsService, eventNames } from '../services/AnalyticsService'

type TabType = 'daily' | 'weekly' | 'monthly' | 'yearly'

const { width } = Dimensions.get('window')

export default function ReportPage() {
  const navigation = useNavigation()
  const store = useStore()
  const { sessions, activities, currentSession, isFirstTime, selectedActivities } = store
  const [activeTab, setActiveTab] = useState<TabType>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [chartView, setChartView] = useState<'timeline' | 'rings'>('timeline')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Log report view when component mounts or tab changes
  React.useEffect(() => {
    AnalyticsService.logEvent(eventNames.REPORT_VIEW, {
      period: activeTab
    })
  }, [activeTab])
  
  const now = selectedDate
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

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

  const handleExport = async () => {
    if (isExporting) return
    
    const showExportOptions = () => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Export as JSON', 'Export as CSV'],
            cancelButtonIndex: 0,
            title: 'Choose Export Format',
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              await exportData('json')
            } else if (buttonIndex === 2) {
              await exportData('csv')
            }
          }
        )
      } else {
        Alert.alert(
          'Choose Export Format',
          '',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Export as JSON', onPress: () => exportData('json') },
            { text: 'Export as CSV', onPress: () => exportData('csv') },
          ],
          { cancelable: true }
        )
      }
    }

    const exportData = async (format: 'json' | 'csv') => {
      try {
        setIsExporting(true)
        
        let content: string
        let fileName: string
        
        if (format === 'json') {
          const exportData = ExportService.prepareExportData(
            activities,
            sessions,
            currentSession,
            isFirstTime,
            selectedActivities
          )
          exportData.deviceInfo.platform = Platform.OS
          content = ExportService.exportToJSON(exportData)
          fileName = ExportService.generateFileName('json', sessions)
        } else {
          content = ExportService.exportToCSV(activities, sessions)
          fileName = ExportService.generateFileName('csv', sessions)
        }
        
        // Write file to temporary directory
        const tempPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`
        await RNFS.writeFile(tempPath, content, 'utf8')
        
        // Share the file
        const result = await Share.share({
          url: Platform.OS === 'ios' ? `file://${tempPath}` : tempPath,
          title: `Export Zen Tracker Data`,
        }, {
          subject: fileName,
          dialogTitle: 'Export Zen Tracker Data',
        })
        
        if (result.action === Share.sharedAction) {
          console.log('Data exported successfully')
          // Log successful export
          AnalyticsService.logEvent(eventNames.DATA_EXPORT, {
            format: format,
            activities_count: activities.length,
            sessions_count: sessions.length
          })
          // Clean up temp file after a delay
          setTimeout(() => {
            RNFS.unlink(tempPath).catch(() => {})
          }, 5000)
        } else {
          // Clean up immediately if cancelled
          RNFS.unlink(tempPath).catch(() => {})
        }
      } catch (error) {
        console.error('Export failed:', error)
        Alert.alert('Export Failed', 'Unable to export data. Please try again.')
      } finally {
        setIsExporting(false)
      }
    }
    
    showExportOptions()
  }

  const handleImport = async () => {
    if (isImporting) return
    
    try {
      setIsImporting(true)
      
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      })
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0]
        // Read file content
        const response = await fetch(file.uri)
        const content = await response.text()
        
        // Determine file type
        const isCSV = file.name?.toLowerCase().endsWith('.csv') || false
        
        if (isCSV) {
          // Handle CSV import
          const parsed = ImportService.parseCSV(content)
          if (parsed) {
            Alert.alert(
              'Import CSV Data',
              `Found ${parsed.activities.length} activities. How would you like to import?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Add to Existing',
                  onPress: () => {
                    // Add imported activities
                    parsed.activities.forEach(activity => {
                      store.addActivity(activity.name)
                      const newActivity = activities[0] // Get the newly added activity
                      if (newActivity) {
                        store.updateActivity(newActivity.id, { totalTime: activity.totalTime })
                      }
                    })
                    Alert.alert('Success', `Imported ${parsed.activities.length} activities`)
                    // Log successful CSV import
                    AnalyticsService.logEvent(eventNames.DATA_IMPORT_SUCCESS, {
                      format: 'csv',
                      mode: 'append',
                      activities_count: parsed.activities.length
                    })
                  }
                },
              ]
            )
          } else {
            Alert.alert('Import Failed', 'Invalid CSV format')
            // Log CSV import error
            AnalyticsService.logEvent(eventNames.DATA_IMPORT_ERROR, {
              format: 'csv',
              error: 'Invalid CSV format'
            })
          }
        } else {
          // Handle JSON import
          const showImportModeOptions = () => {
            Alert.alert(
              'Import Data',
              'How would you like to import the data?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Replace All',
                  style: 'destructive',
                  onPress: () => confirmImport('replace'),
                },
                {
                  text: 'Merge',
                  onPress: () => confirmImport('merge'),
                },
                {
                  text: 'Add as New',
                  onPress: () => confirmImport('append'),
                },
              ]
            )
          }
          
          const confirmImport = async (mode: 'replace' | 'merge' | 'append') => {
            const result = await ImportService.importData(
              content,
              activities,
              sessions,
              { mode }
            )
            
            if (result.success && result.data) {
              // Actually update the store with imported data
              store.importData(result.data, mode)
              
              Alert.alert(
                'Import Successful',
                `Imported ${result.activitiesImported} activities and ${result.sessionsImported} sessions`
              )
              // Log successful JSON import
              AnalyticsService.logEvent(eventNames.DATA_IMPORT_SUCCESS, {
                format: 'json',
                mode: mode,
                activities_count: result.activitiesImported,
                sessions_count: result.sessionsImported
              })
            } else {
              Alert.alert('Import Failed', result.error || 'Unknown error occurred')
              // Log JSON import error
              AnalyticsService.logEvent(eventNames.DATA_IMPORT_ERROR, {
                format: 'json',
                mode: mode,
                error: result.error || 'Unknown error'
              })
            }
          }
          
          showImportModeOptions()
        }
      }
    } catch (error) {
      console.error('Import failed:', error)
      Alert.alert('Import Failed', 'Unable to import data. Please try again.')
    } finally {
      setIsImporting(false)
    }
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


  // Calculate chart data for different views
  const chartData = useMemo(() => {
    const range = getDateRange(activeTab)
    
    if (activeTab === 'weekly') {
      // Get data for each day of the week
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      
      return weekDays.map((day, index) => {
        const dayDate = addDays(weekStart, index)
        const dayStart = startOfDay(dayDate)
        const dayEnd = endOfDay(dayDate)
        
        const daySessions = sessions.filter(session =>
          isWithinInterval(new Date(session.startTime), { start: dayStart, end: dayEnd })
        )
        
        const totalTime = daySessions.reduce((acc, session) => acc + session.duration, 0)
        const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        
        return {
          label: day,
          value: totalTime,
          isHighlighted: isToday,
          maxValue: Math.max(...weekDays.map((_, i) => {
            const d = addDays(weekStart, i)
            const ds = startOfDay(d)
            const de = endOfDay(d)
            const dSessions = sessions.filter(s =>
              isWithinInterval(new Date(s.startTime), { start: ds, end: de })
            )
            return dSessions.reduce((acc, s) => acc + s.duration, 0)
          }))
        }
      })
    } else if (activeTab === 'monthly') {
      // Get data for each month of the year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const year = selectedDate.getFullYear()
      const currentMonth = getMonth(selectedDate)
      
      return months.map((month, index) => {
        const monthStart = startOfMonth(new Date(year, index))
        const monthEnd = endOfMonth(new Date(year, index))
        
        const monthSessions = sessions.filter(session =>
          isWithinInterval(new Date(session.startTime), { start: monthStart, end: monthEnd })
        )
        
        const totalTime = monthSessions.reduce((acc, session) => acc + session.duration, 0)
        
        return {
          label: month,
          value: totalTime,
          isHighlighted: index === currentMonth,
          maxValue: Math.max(...months.map((_, i) => {
            const ms = startOfMonth(new Date(year, i))
            const me = endOfMonth(new Date(year, i))
            const mSessions = sessions.filter(s =>
              isWithinInterval(new Date(s.startTime), { start: ms, end: me })
            )
            return mSessions.reduce((acc, s) => acc + s.duration, 0)
          }))
        }
      })
    } else if (activeTab === 'yearly') {
      // Get data for current and previous year
      const currentYear = selectedDate.getFullYear()
      const years = [currentYear - 1, currentYear]
      
      return years.map(year => {
        const yearStart = startOfYear(new Date(year, 0))
        const yearEnd = endOfYear(new Date(year, 0))
        
        const yearSessions = sessions.filter(session =>
          isWithinInterval(new Date(session.startTime), { start: yearStart, end: yearEnd })
        )
        
        const totalTime = yearSessions.reduce((acc, session) => acc + session.duration, 0)
        
        return {
          label: year.toString(),
          value: totalTime,
          isHighlighted: year === currentYear,
          maxValue: Math.max(...years.map(y => {
            const ys = startOfYear(new Date(y, 0))
            const ye = endOfYear(new Date(y, 0))
            const ySessions = sessions.filter(s =>
              isWithinInterval(new Date(s.startTime), { start: ys, end: ye })
            )
            return ySessions.reduce((acc, s) => acc + s.duration, 0)
          }))
        }
      })
    }
    
    return []
  }, [sessions, activeTab, selectedDate])

  const BarChart = ({ data }: { data: typeof chartData }) => {
    const chartPadding = 24
    const chartWidth = width - 48 - (chartPadding * 2)
    const chartHeight = 200
    
    // Adjust bar width and spacing based on data length
    const barWidth = chartWidth / data.length * 0.6
    const spacing = chartWidth / data.length * 0.4
    
    const maxValue = Math.max(...data.map(d => d.maxValue || 1), 1)
    
    return (
      <View style={styles.barChartContainer}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight * 0.8
            const x = index * (barWidth + spacing) + spacing / 2
            const y = chartHeight - barHeight - 20
            
            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.isHighlighted ? '#000000' : '#9CA3AF'}
                  rx={4}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight}
                  fontSize="12"
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </React.Fragment>
            )
          })}
        </Svg>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('Home')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleImport}
            style={styles.headerButton}
            disabled={isImporting}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.headerButtonText, isImporting && styles.headerButtonDisabled]}>📂</Text>
              <Text style={[styles.buttonLabel, isImporting && styles.headerButtonDisabled]}>import</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExport}
            style={styles.headerButton}
            disabled={isExporting}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.headerButtonText, isExporting && styles.headerButtonDisabled]}>💾</Text>
              <Text style={[styles.buttonLabel, isExporting && styles.headerButtonDisabled]}>export</Text>
            </View>
          </TouchableOpacity>
        </View>
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
            <View style={styles.todayLinkContainer}>
              {!isToday && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(new Date())}
                  style={styles.todayLink}
                >
                  <Text style={styles.todayLinkText}>Back to Today</Text>
                </TouchableOpacity>
              )}
            </View>
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
                <TimelineChart activities={activities} sessions={sessions} date={selectedDate} />
              ) : (
                <RingsChart activities={activities} sessions={sessions} date={selectedDate} />
              )}
            </View>
          </>
        )}

        {activeTab === 'weekly' && (
          <>
            <View style={styles.todayLinkContainer}>
              {!isToday && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(new Date())}
                  style={styles.todayLink}
                >
                  <Text style={styles.todayLinkText}>Back to Today</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dateNavigation}>
              <TouchableOpacity
                onPress={() => setSelectedDate(subWeeks(selectedDate, 1))}
                style={styles.dateNavButton}
              >
                <Text style={styles.dateNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel}>
                {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy. MM. dd')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MM.dd')}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(addWeeks(selectedDate, 1))}
                style={styles.dateNavButton}
                disabled={format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
              >
                <Text style={[
                  styles.dateNavText,
                  format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd') && styles.disabledText
                ]}>›</Text>
              </TouchableOpacity>
            </View>
            
            <BarChart data={chartData} />
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            <View style={styles.todayLinkContainer}>
              {(format(selectedDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM')) && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(new Date())}
                  style={styles.todayLink}
                >
                  <Text style={styles.todayLinkText}>Back to Today</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dateNavigation}>
              <TouchableOpacity
                onPress={() => setSelectedDate(subMonths(selectedDate, 1))}
                style={styles.dateNavButton}
              >
                <Text style={styles.dateNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel}>
                {format(selectedDate, 'yyyy. MM')}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(addMonths(selectedDate, 1))}
                style={styles.dateNavButton}
                disabled={format(selectedDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
              >
                <Text style={[
                  styles.dateNavText,
                  format(selectedDate, 'yyyy-MM') >= format(new Date(), 'yyyy-MM') && styles.disabledText
                ]}>›</Text>
              </TouchableOpacity>
            </View>
            
            <BarChart data={chartData} />
          </>
        )}

        {activeTab === 'yearly' && (
          <>
            <View style={styles.todayLinkContainer}>
              {selectedDate.getFullYear() !== new Date().getFullYear() && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(new Date())}
                  style={styles.todayLink}
                >
                  <Text style={styles.todayLinkText}>Back to Today</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dateNavigation}>
              <TouchableOpacity
                onPress={() => setSelectedDate(subYears(selectedDate, 1))}
                style={styles.dateNavButton}
              >
                <Text style={styles.dateNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateLabel}>
                {format(selectedDate, 'yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(addYears(selectedDate, 1))}
                style={styles.dateNavButton}
                disabled={selectedDate.getFullYear() >= new Date().getFullYear()}
              >
                <Text style={[
                  styles.dateNavText,
                  selectedDate.getFullYear() >= new Date().getFullYear() && styles.disabledText
                ]}>›</Text>
              </TouchableOpacity>
            </View>
            
            <BarChart data={chartData} />
          </>
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
            {stats.activityStats.map((stat) => (
              <View key={stat.id} style={styles.activityBarItem}>
                <View style={styles.activityBarHeader}>
                  <View style={styles.activityInfo}>
                    <View style={[styles.activityDot, { backgroundColor: getActivityColor(stat.id, activities) }]} />
                    <Text style={styles.activityName}>{stat.name}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {formatDuration(stat.totalTime)} / {formatDuration(stat.avgTime)}
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={styles.barBackground}>
                    <View 
                      style={[
                        styles.barFill, 
                        { 
                          width: `${stat.percentage}%`,
                          backgroundColor: getActivityColor(stat.id, activities)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentageText}>{stat.percentage.toFixed(0)}%</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activities recorded</Text>
            {isToday && (
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('Home')}
                style={styles.startTrackingButton}
              >
                <Text style={styles.startTrackingText}>Start Tracking</Text>
              </TouchableOpacity>
            )}
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
  headerButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  buttonContent: {
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: '#000',
  },
  buttonLabel: {
    fontSize: 9,
    color: '#FF0000',
    marginTop: -2,
  },
  headerButtonDisabled: {
    color: '#9CA3AF',
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
  barChartContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  todayLinkContainer: {
    height: 24,
    alignItems: 'flex-end',
    paddingRight: 8,
    marginBottom: 4,
  },
  todayLink: {
    padding: 0,
  },
  todayLinkText: {
    fontSize: 13,
    fontWeight: '300',
    color: '#9CA3AF',
  },
  activityBarItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    minWidth: 30,
    textAlign: 'right',
  },
})