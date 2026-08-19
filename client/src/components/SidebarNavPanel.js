import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HistoryIcon from '@mui/icons-material/History';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const SidebarNavPanel = ({ onClose, onSelect, darkMode }) => {
  const sections = [
    {
      id: 'home',
      label: '🏡 Home',
      description: 'Go back to the main dashboard',
      icon: <HomeIcon sx={{ color: '#9c27b0' }} />
    },
    {
      id: 'current',
      label: '🌱 Current Tasks',
      description: 'Active tasks sorted by priority',
      icon: <TaskAltIcon sx={{ color: '#69C37D' }} />
    },
    {
      id: 'calendar',
      label: '📅 Calendar',
      description: 'View tasks on a daily timeline',
      icon: <CalendarMonthIcon sx={{ color: '#0097a7' }} />
    },
    {
      id: 'history',
      label: '📜 History',
      description: 'Completed tasks and past progress',
      icon: <HistoryIcon sx={{ color: '#388e3c' }} />
    },
    {
      id: 'streak',
      label: '🔥 Streak',
      description: 'Your garden and streak progress',
      icon: <LocalFireDepartmentIcon sx={{ color: '#ff6f00' }} />
    }
  ];

  return (
    <Box
      sx={{
        width: 320,
        p: 0,
        bgcolor: darkMode ? '#162418' : '#FCFFFC',
        color: darkMode ? '#d4edda' : '#2E4634',
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
        borderBottom: `1px solid ${darkMode ? 'rgba(105,195,125,0.15)' : 'rgba(105,195,125,0.2)'}`,
        background: darkMode
          ? 'linear-gradient(135deg, #1a3320 0%, #162418 100%)'
          : 'linear-gradient(135deg, #f0faf0 0%, #FCFFFC 100%)'
      }}>
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              cursor: 'pointer',
              color: darkMode ? '#69C37D' : '#3F8F5A',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
            onClick={() => onSelect('home')}
          >
            🌿 Schedula
          </Typography>
          <Typography variant="caption" sx={{ color: darkMode ? '#8fac93' : '#6C7A6D' }}>
            Your Productivity Garden
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: darkMode ? '#8fac93' : '#6C7A6D',
            '&:hover': { bgcolor: darkMode ? 'rgba(105,195,125,0.1)' : 'rgba(105,195,125,0.1)', color: '#69C37D' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Nav items */}
      <List sx={{ flex: 1, pt: 1, px: 1 }}>
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <ListItemButton
              onClick={() => onSelect(section.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.2,
                px: 1.5,
                animation: `fadeSlideIn 0.3s ease forwards`,
                animationDelay: `${index * 0.05}s`,
                opacity: 0,
                '@keyframes fadeSlideIn': {
                  from: { opacity: 0, transform: 'translateX(-12px)' },
                  to: { opacity: 1, transform: 'translateX(0)' }
                },
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(105,195,125,0.1)' : 'rgba(105,195,125,0.08)',
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
                    color: darkMode ? '#d4edda' : '#2E4634'
                  }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                    color: darkMode ? '#8fac93' : '#6C7A6D'
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
        background: darkMode
          ? 'linear-gradient(135deg, #2a1a00 0%, #1a1200 100%)'
          : 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)',
        border: `1px solid ${darkMode ? '#7a4500' : '#F6C453'}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography
          variant="subtitle2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            color: darkMode ? '#ffb74d' : '#b25f00',
            fontWeight: 700
          }}
        >
          🌱 Garden Tip
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.8, color: darkMode ? '#aaa' : '#6C7A6D', fontSize: 12 }}>
          Complete tasks daily to keep your plant growing. Consistency is the key to a thriving garden!
        </Typography>
        <Typography sx={{ position: 'absolute', bottom: 4, right: 8, fontSize: 32, opacity: 0.12 }}>
          🌻
        </Typography>
      </Box>
    </Box>
  );
};

export default SidebarNavPanel;