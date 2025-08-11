import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Activity, Session } from '../store/store';

interface TimelineChartProps {
  activities: Activity[];
  sessions: Session[];
  date: Date;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const hourWidth = chartWidth / 24;

export const TimelineChart: React.FC<TimelineChartProps> = ({ activities, sessions, date }) => {
  const formatTime = (hour: number) => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  const getActivityColor = (activityName: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];
    let hash = 0;
    for (let i = 0; i < activityName.length; i++) {
      hash = activityName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
            color: getActivityColor(activity.name)
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
      
      <View style={styles.timeAxis}>
        {Array.from({ length: 25 }, (_, i) => (
          <View key={i} style={[styles.hourMark, { width: hourWidth }]}>
            {i % 4 === 0 && (
              <Text style={styles.hourText}>{formatTime(i)}</Text>
            )}
            <View style={[styles.hourLine, { opacity: i % 2 === 0 ? 1 : 0.3 }]} />
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
                <Text style={styles.sessionText} numberOfLines={1}>
                  {session.activity}
                </Text>
              </View>
            ))}
          </View>
        ))}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  timeAxis: {
    flexDirection: 'row',
    height: 40,
    marginBottom: 16,
  },
  hourMark: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  hourText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  hourLine: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
  },
  tracksContainer: {
    minHeight: 60,
  },
  track: {
    height: 32,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
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
    color: 'white',
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