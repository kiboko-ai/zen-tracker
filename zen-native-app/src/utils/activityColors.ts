export const ACTIVITY_COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB'];

export const getActivityColor = (activityId: string, activities: Array<{ id: string }>) => {
  const index = activities.findIndex(a => a.id === activityId);
  return ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];
};