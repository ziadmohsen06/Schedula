import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, Alert, Paper,
  List, ListItem, ListItemText, IconButton, Avatar, Chip, CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {
  getFriends, getIncomingRequests, sendFriendRequest, respondToRequest,
  removeFriend, getLeaderboard
} from '../services/api';
import AppShell from '../components/AppShell';

const medal = ['🥇', '🥈', '🥉'];

const SocialPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, leaderboardRes] = await Promise.all([
        getFriends(), getIncomingRequests(), getLeaderboard()
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      setError('Failed to load social data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await sendFriendRequest(email);
      setSuccess(`Friend request sent to ${email}`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespond = async (id, action) => {
    try {
      await respondToRequest(id, action);
      loadData();
    } catch (err) {
      setError('Failed to respond to request');
    }
  };

  const handleRemove = async (friendshipId) => {
    try {
      await removeFriend(friendshipId);
      loadData();
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">👥 Study Buddies</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add a Study Buddy</Typography>
          <Box component="form" onSubmit={handleSendRequest} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Friend's email" type="email" fullWidth
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
            <Button type="submit" variant="contained" startIcon={<PersonAddIcon />} sx={{ whiteSpace: 'nowrap' }}>
              Add
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {requests.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Pending Requests</Typography>
                <List disablePadding>
                  {requests.map((r) => (
                    <ListItem
                      key={r._id}
                      disableGutters
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton color="success" onClick={() => handleRespond(r._id, 'accept')}><CheckIcon /></IconButton>
                          <IconButton color="error" onClick={() => handleRespond(r._id, 'decline')}><CloseIcon /></IconButton>
                        </Box>
                      }
                    >
                      <Avatar src={r.requester.photoUrl || undefined} sx={{ mr: 1.5 }}>{r.requester.name.charAt(0)}</Avatar>
                      <ListItemText primary={r.requester.name} secondary={r.requester.email} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon fontSize="small" /> Leaderboard
              </Typography>
              <List disablePadding>
                {leaderboard.map((entry, i) => (
                  <ListItem key={entry._id} disableGutters>
                    <Typography sx={{ width: 32 }}>{medal[i] || `#${i + 1}`}</Typography>
                    <ListItemText
                      primary={entry.name}
                      secondary={`${entry.totalCompleted} tasks completed`}
                    />
                    <Chip
                      icon={<LocalFireDepartmentIcon />}
                      label={`${entry.streak} day streak`}
                      size="small"
                      color={entry.streak > 0 ? 'warning' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Your Study Buddies</Typography>
              {friends.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No study buddies yet — add one above.</Typography>
              ) : (
                <List disablePadding>
                  {friends.map((f) => (
                    <ListItem
                      key={f.friendshipId}
                      disableGutters
                      secondaryAction={
                        <IconButton onClick={() => handleRemove(f.friendshipId)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      }
                    >
                      <Avatar src={f.photoUrl || undefined} sx={{ mr: 1.5 }}>{f.name.charAt(0)}</Avatar>
                      <ListItemText primary={f.name} secondary={`${f.totalCompleted} tasks · ${f.streak} day streak`} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </>
        )}
      </Container>
    </AppShell>
  );
};

export default SocialPage;
