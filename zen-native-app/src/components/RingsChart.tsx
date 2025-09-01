import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { Activity, Session } from '../store/store';
import { getActivityColor } from '../utils/activityColors';

interface RingsChartProps {
  activities: Activity[];
  sessions: Session[];
  date: Date;
}

const { width: screenWidth } = Dimensions.get('window');
const chartSize = Math.min(screenWidth - 60, 320); // 차트 크기 증가
const center = chartSize / 2;

export const RingsChart: React.FC<RingsChartProps> = ({ activities, sessions, date }) => {

  const getSessionsForDate = () => {
    const targetDate = date.toDateString();
    const chartSessions: Array<{
      activityId: string;
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
            activityId: activity.id,
            activity: activity.name,
            startHour,
            endHour,
            duration: endHour - startHour,
            color: getActivityColor(activity.id, activities)
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
    const outerRadius = center - 50; // 시간 표시를 도넛에 더 가깝게
    
    // Add tick marks for all 24 hours
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15) - 90; // 15 degrees per hour, start from top
      const angleRad = angle * Math.PI / 180;
      
      // Major tick marks (every 3 hours) are longer
      const isMajor = i % 3 === 0;
      const tickLength = isMajor ? 8 : 4;
      
      const x1 = center + (outerRadius - tickLength) * Math.cos(angleRad);
      const y1 = center + (outerRadius - tickLength) * Math.sin(angleRad);
      const x2 = center + outerRadius * Math.cos(angleRad);
      const y2 = center + outerRadius * Math.sin(angleRad);
      
      markers.push(
        <Path
          key={`tick-${i}`}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke={isMajor ? "#666" : "#CCC"}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
      
      // Only add text for major markers (every 3 hours)
      if (isMajor) {
        // Position text closer to the donut
        const textRadius = outerRadius + 12; // 도넛에 더 가깝게
        const textX = center + textRadius * Math.cos(angleRad);
        const textY = center + textRadius * Math.sin(angleRad);
        
        markers.push(
          <G key={`text-${i}`}>
            <SvgText
              x={textX}
              y={textY + 2}
              fontSize="9"
              fill="#666"
              textAnchor="middle"
              fontWeight="400"
            >
              {i.toString().padStart(2, '0')}
            </SvgText>
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

    const rings: React.ReactElement[] = [];
    const activities_list = Object.keys(activityGroups);
    const ringWidth = 20; // 링 너비 더 증가
    const startRadius = 80; // 시작 반지름 더 증가 (도넛 원 크게)

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
    const activityGroups: { [key: string]: { name: string; duration: number; color: string } } = {};
    
    chartSessions.forEach(session => {
      if (!activityGroups[session.activityId]) {
        activityGroups[session.activityId] = {
          name: session.activity,
          duration: 0,
          color: session.color
        };
      }
      activityGroups[session.activityId].duration += session.duration;
    });

    return Object.values(activityGroups).map((activity, index) => (
      <View key={index} style={styles.legendItem}>
        <View 
          style={[
            styles.legendColor, 
            { backgroundColor: activity.color }
          ]} 
        />
        <Text style={styles.legendText}>
          {activity.name} ({activity.duration.toFixed(1)}h)
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rings View</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={chartSize + 50} height={chartSize + 50} viewBox={`-25 -25 ${chartSize + 50} ${chartSize + 50}`}>
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