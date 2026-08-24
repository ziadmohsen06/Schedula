import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, IconButton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FlagIcon from '@mui/icons-material/Flag';
import RepeatIcon from '@mui/icons-material/Repeat';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GroupIcon from '@mui/icons-material/Group';
import { getThemeContent } from '../themeContent';

const SidebarNavPanel = ({ onClose, onSelect, darkMode, content }) => {
  const c = content || getThemeContent('garden');
  const theme = useTheme();
  const sections = [
    {
      id: 'current',
      label: `${c.tasksEmoji} Current Tasks`,
      description: 'Active tasks sorted by priority',
      icon: <TaskAltIcon color="primary" />
    },
    {
      id: 'gpa',
      label: '🎓 GPA Tracker',
      description: 'Courses, grades, and your GPA',
      icon: <SchoolIcon sx={{ color: '#5c6bc0' }} />
    },
    {
      id: 'assignments',
      label: '📝 Assignments',
      description: 'University assignments and submission links',
      icon: <AssignmentIcon sx={{ color: '#00897b' }} />
    },
    {
      id: 'class-schedule',
      label: '📚 Class Schedule',
      description: 'Your weekly timetable',
      icon: <EventNoteIcon sx={{ color: '#8d6e63' }} />
    },
    {
      id: 'goals',
      label: '🎯 Goals',
      description: 'Big goals broken into weekly milestones',
      icon: <FlagIcon sx={{ color: '#e53935' }} />
    },
    {
      id: 'habits',
      label: '🔁 Habits',
      description: 'Daily habits with their own streaks',
      icon: <RepeatIcon sx={{ color: '#43a047' }} />
    },
    {
      id: 'weekly-review',
      label: '📆 Weekly Review',
      description: 'Completed, missed, and suggestions',
      icon: <RateReviewIcon sx={{ color: '#fb8c00' }} />
    },
    {
      id: 'social',
      label: '👥 Study Buddies',
      description: 'Friends, leaderboard, and shared progress',
      icon: <GroupIcon sx={{ color: '#1e88e5' }} />
    }
  ];

  return (
    <Box
      sx={{
        width: 320,
        p: 0,
        bgcolor: 'background.paper',
        color: 'text.primary',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      role="presentation"
    >
      {/* Header */}
      <Box sx={{
        p: 2.5,
        pb: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.paper} 100%)`
      }}>
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
            onClick={() => onSelect('home')}
          >
            {c.logoEmoji} Schedula
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {c.tagline}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Nav items */}
      <List sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pt: 1, px: 1 }}>
        {sections.map((section) => (
          <React.Fragment key={section.id}>
            <ListItemButton
              onClick={() => onSelect(section.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.2,
                px: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Box sx={{ fontSize: 22 }}>{section.icon}</Box>
                <ListItemText
                  primary={section.label}
                  secondary={section.description}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'text.primary'
                  }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                    color: 'text.secondary'
                  }}
                />
              </Box>
            </ListItemButton>
          </React.Fragment>
        ))}
      </List>

      {/* Bottom tip card */}
      <Box sx={{
        m: 2,
        p: 2,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, darkMode ? 0.18 : 0.15)} 0%, ${alpha(theme.palette.secondary.main, darkMode ? 0.08 : 0.06)} 100%)`,
        border: '1px solid',
        borderColor: alpha(theme.palette.secondary.main, 0.4),
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography
          variant="subtitle2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            color: 'secondary.main',
            fontWeight: 700
          }}
        >
          {c.tipEmoji} {c.tipTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, fontSize: 12 }}>
          {c.tipText}
        </Typography>
        <Typography sx={{ position: 'absolute', bottom: 4, right: 8, fontSize: 32, opacity: 0.12 }}>
          {c.tipEmoji}
        </Typography>
      </Box>
    </Box>
  );
};

export default SidebarNavPanel;