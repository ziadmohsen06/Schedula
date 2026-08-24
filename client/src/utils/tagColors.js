export const TAG_COLORS = {
  University: '#1976d2',
  School: '#00897b',
  Test: '#d32f2f',
  Work: '#9c27b0',
  Personal: '#69C37D',
  Gym: '#ff9800',
  Errands: '#f44336',
  Other: '#607d8b'
};

export const getTagColor = (tag) => TAG_COLORS[tag] || TAG_COLORS.Other;
