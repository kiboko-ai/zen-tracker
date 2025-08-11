import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Activity, Session } from '../store/store';

interface RingsChartProps {
  activities: Activity[];
  sessions: Session[];
  date: Date;
}

const { width: screenWidth } = Dimensions.get('window');
const chartSize = Math.min(screenWidth - 40, 300);
const center = chartSize / 2;

export const RingsChart: React.FC<RingsChartProps> = ({ activities, sessions, date }) => {
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

    return chartSessions;
  };

  const chartSessions = getSessionsForDate();

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const renderHourMarkers = () => {
    const markers = [];
    const outerRadius = center - 20;
    
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15) - 90;
      const angleRad = angle * Math.PI / 180;
      
      const x1 = center + (outerRadius - 10) * Math.cos(angleRad);
      const y1 = center + (outerRadius - 10) * Math.sin(angleRad);
      const x2 = center + outerRadius * Math.cos(angleRad);
      const y2 = center + outerRadius * Math.sin(angleRad);
      
      markers.push(
        <Path
          key={i}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke="#ddd"
          strokeWidth={i % 6 === 0 ? 2 : 1}
        />
      );
      
      if (i % 6 === 0) {
        const textX = center + (outerRadius - 25) * Math.cos(angleRad);
        const textY = center + (outerRadius - 25) * Math.sin(angleRad);
        
        markers.push(
          <G key={`text-${i}`}>
            <Text
              x={textX}
              y={textY + 4}
              fontSize="12"
              fill="#666"
              textAnchor="middle"
            >
              {i.toString().padStart(2, '0')}
            </Text>
          </G>
        );
      }
    }
    
    return markers;
  };

  const renderActivityRings = () => {
    const activityGroups: { [key: string]: typeof chartSessions } = {};
    
    chartSessions.forEach(session => {
      if (!activityGroups[session.activity]) {
        activityGroups[session.activity] = [];
      }
      activityGroups[session.activity].push(session);
    });

    const rings = [];
    const activities_list = Object.keys(activityGroups);
    const ringWidth = 15;
    const startRadius = 60;

    activities_list.forEach((activityName, ringIndex) => {
      const radius = startRadius + ringIndex * (ringWidth + 5);
      const sessionsForActivity = activityGroups[activityName];
      
      rings.push(
        <Circle
          key={`bg-${ringIndex}`}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={ringWidth}
        />
      );

      sessionsForActivity.forEach((session, sessionIndex) => {
        const startAngle = (session.startHour / 24) * 360;
        const endAngle = (session.endHour / 24) * 360;
        
        if (endAngle > startAngle) {
          rings.push(
            <Path
              key={`${ringIndex}-${sessionIndex}`}
              d={createArcPath(startAngle, endAngle, radius)}
              fill="none"
              stroke={session.color}
              strokeWidth={ringWidth}
              strokeLinecap="round"
            />
          );
        }
      });
    });

    return rings;
  };

  const renderLegend = () => {
    const activityGroups: { [key: string]: number } = {};
    
    chartSessions.forEach(session => {
      if (!activityGroups[session.activity]) {
        activityGroups[session.activity] = 0;
      }
      activityGroups[session.activity] += session.duration;
    });

    return Object.keys(activityGroups).map((activityName, index) => (
      <View key={index} style={styles.legendItem}>
        <View 
          style={[
            styles.legendColor, 
            { backgroundColor: getActivityColor(activityName) }
          ]} 
        />
        <Text style={styles.legendText}>
          {activityName} ({activityGroups[activityName].toFixed(1)}h)
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rings View</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize}>
          {renderHourMarkers()}
          {renderActivityRings()}
        </Svg>
      </View>

      {chartSessions.length > 0 ? (
        <View style={styles.legend}>
          {renderLegend()}
        </View>
      ) : (
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legend: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
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