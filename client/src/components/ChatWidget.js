import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton,
  Chip, Fab, Collapse, Avatar
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { sendChatCommand } from '../services/api';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const ChatWidget = () => {
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hi! I can help you manage your schedule. Try saying things like "move everything to next week" or "what do I have tomorrow?"'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickCommands = [
    'What do I have today?',
    'Move everything to next week',
    'I have an exam Thursday',
    'Reschedule my urgent tasks'
  ];

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim() || loading) return;

    setMessages(prev => [...prev, { type: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await sendChatCommand(message);
      
      setMessages(prev => [
        ...prev,
        { 
          type: 'bot', 
          text: data.result?.message || 'Command processed successfully!' 
        }
      ]);

      // Refresh tasks
      window.dispatchEvent(new Event('tasksUpdated'));
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { 
          type: 'bot', 
          text: 'Sorry, I could not process that command. Please try again.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Fab
        color="primary"
        onClick={() => setOpen(!open)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: 'primary.main',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat panel */}
      <Collapse in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 350,
            height: 500,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Header */}
          <Box sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}>
            <Typography variant="h6" fontWeight="bold">{content.logoEmoji} Calendar Assistant</Typography>
            <Typography variant="caption">Ask me to manage your schedule</Typography>
          </Box>

          {/* Messages */}
          <Box sx={{
            flex: 1,
            p: 2,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                {msg.type === 'bot' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    borderRadius: 2,
                    bgcolor: msg.type === 'user' ? 'primary.main' : 'action.hover',
                    color: msg.type === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
                {msg.type === 'user' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick commands */}
          <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {quickCommands.map((cmd, index) => (
              <Chip
                key={index}
                label={cmd}
                size="small"
                onClick={() => handleSend(cmd)}
                sx={{ fontSize: 11, cursor: 'pointer' }}
              />
            ))}
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type a command..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.default',
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={() => handleSend()}
                disabled={loading}
                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <SendIcon sx={{ color: 'primary.contrastText' }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default ChatWidget;