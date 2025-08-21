import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Activity, Session } from '../store/store';
import { getActivityColor } from '../utils/activityColors';

interface TimelineChartProps {
  activities: Activity[];
  sessions: Session[];
  date: Date;
}

const { width: screenWidth } = Dimensions.get('window');
// 화면 너비에 맞춰 시간당 너비 계산
const padding = 32; // 좌우 패딩
const availableWidth = screenWidth - padding;
const hourWidth = availableWidth / 6; // 화면에 6시간씩 표시
const chartWidth = hourWidth * 24;

export const TimelineChart: React.FC<TimelineChartProps> = ({ activities, sessions, date }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 가장 최근 세션 또는 현재 시간으로 스크롤
  useEffect(() => {
    let scrollPosition = 0;
    
    // 가장 최근 세션 찾기
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime).toDateString();
      return sessionDate === date.toDateString() && session.endTime;
    });
    
    if (todaySessions.length > 0) {
      // 가장 최근 세션으로 스크롤
      const lastSession = todaySessions[todaySessions.length - 1];
      const endTime = new Date(lastSession.endTime!);
      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
      scrollPosition = Math.max(0, (endHour - 3) * hourWidth);
    } else {
      // 세션이 없으면 현재 시간으로 스크롤
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      scrollPosition = Math.max(0, (currentHour - 3) * hourWidth);
    }
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
    }, 100);
  }, [sessions, date]);
  
  const formatTime = (hour: number) => {
    return hour.toString().padStart(2, '0') + ':00';
  };


  const getSessionsForDate = () => {
    const targetDate = date.toDateString();
    const chartSessions: Array<{
      activity: string;
      startHour: number;
      endHour: number;
      duration: number;
      color: string;
    }> = [];

    if (!sessions || sessions.length === 0 || !activities || activities.length === 0) {
      return chartSessions;
    }

    sessions.forEach(session => {
      const sessionDate = new Date(session.startTime).toDateString();
      if (sessionDate === targetDate && session.endTime) {
        const activity = activities.find(a => a.id === session.activityId);
        if (activity) {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          const startHour = startTime.getHours() + startTime.getMinutes() / 60;
          const endHour = endTime.getHours() + endTime.getMinutes() / 60;
          
          chartSessions.push({
            activity: activity.name,
            startHour,
            endHour,
            duration: endHour - startHour,
            color: getActivityColor(activity.id, activities)
          });
        }
      }
    });

    return chartSessions.sort((a, b) => a.startHour - b.startHour);
  };

  const chartSessions = getSessionsForDate();

  const assignTracks = (sessions: typeof chartSessions) => {
    const tracks: Array<Array<typeof sessions[0]>> = [];
    
    sessions.forEach(session => {
      let assigned = false;
      
      for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
        const track = tracks[trackIndex];
        const lastSession = track[track.length - 1];
        
        if (!lastSession || session.startHour >= lastSession.endHour + 0.1) {
          track.push(session);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        tracks.push([session]);
      }
    });
    
    return tracks;
  };

  const tracks = assignTracks(chartSessions);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline View</Text>
      <Text style={styles.scrollHint}>← Swipe to see 24 hours →</Text>
      
      <View style={styles.scrollWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          scrollIndicatorInsets={{ bottom: 0 }}
        >
        <View>
          <View style={styles.timeAxis}>
            {Array.from({ length: 25 }, (_, i) => (
              <View key={i} style={[styles.hourMark, { width: i === 24 ? 30 : hourWidth }]}>
                <Text style={[styles.hourText, { fontSize: i % 3 === 0 ? 10 : 8 }]}>
                  {i.toString().padStart(2, '0')}
                </Text>
                {i < 24 && (
                  <View style={[styles.hourLine, { opacity: i % 3 === 0 ? 1 : 0.5 }]} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.tracksContainer}>
            {tracks.map((track, trackIndex) => (
              <View key={trackIndex} style={[styles.track, { marginBottom: trackIndex < tracks.length - 1 ? 8 : 0 }]}>
                {track.map((session, sessionIndex) => (
                  <View
                    key={sessionIndex}
                    style={[
                      styles.sessionBar,
                      {
                        left: session.startHour * hourWidth,
                        width: session.duration * hourWidth,
                        backgroundColor: session.color
                      }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.sessionText, 
                        { 
                          color: session.color === '#CCCCCC' || session.color === '#A6A6A6' || session.color === '#D9D9D9' 
                            ? '#000' : '#fff' 
                        }
                      ]} 
                      numberOfLines={1}
                    >
                      {session.activity}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
        
        {/* 스크롤 힌트 - 좌우 그라데이션 */}
        <View style={styles.scrollHintLeft} pointerEvents="none" />
        <View style={styles.scrollHintRight} pointerEvents="none" />
      </View>

      {tracks.length === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No activities recorded for this date</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  scrollWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 20,
  },
  scrollHintLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 10,
    width: 20,
    backgroundColor: 'white',
    opacity: 0.9,
    zIndex: 1,
  },
  scrollHintRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 10,
    width: 20,
    backgroundColor: 'white',
    opacity: 0.9,
    zIndex: 1,
  },
  timeAxis: {
    flexDirection: 'row',
    height: 30,
    width: chartWidth + 30, // 24시 표시를 위한 추가 공간
  },
  hourMark: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  hourText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  hourLine: {
    width: 1,
    height: 12,
    backgroundColor: '#ddd',
  },
  tracksContainer: {
    minHeight: 60,
    width: chartWidth,
  },
  track: {
    height: 32,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    width: chartWidth,
  },
  sessionBar: {
    position: 'absolute',
    height: 28,
    top: 2,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
    minWidth: 2,
  },
  sessionText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  noDataContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 14,
  },
});