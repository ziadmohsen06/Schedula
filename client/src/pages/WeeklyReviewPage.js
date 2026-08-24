import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Alert, Paper, List, ListItem, ListItemText, CircularProgress, Chip } from '@mui/material';
import { getWeeklyReview } from '../services/api';
import AppShell from '../components/AppShell';

const WeeklyReviewPage = () => {
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getWeeklyReview()
      .then(({ data }) => setReview(data))
      .catch(() => setError('Failed to load weekly review'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">📆 Weekly Review</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : review && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', textAlign: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{review.completedCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Completed</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{review.missedCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Missed</Typography>
                </Box>
                {review.completionRate !== null && (
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">{review.completionRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">Completion</Typography>
                  </Box>
                )}
              </Box>
              <Alert severity="info">{review.suggestion}</Alert>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>✅ Completed this week</Typography>
              {review.completed.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nothing completed yet.</Typography>
              ) : (
                <List disablePadding>
                  {review.completed.map((t) => (
                    <ListItem key={t._id} disableGutters>
                      <ListItemText primary={t.title} secondary={new Date(t.completedAt).toLocaleDateString()} />
                      <Chip label="Done" size="small" color="success" />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>⚠️ Missed this week</Typography>
              {review.missed.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nothing missed — great week!</Typography>
              ) : (
                <List disablePadding>
                  {review.missed.map((t) => (
                    <ListItem key={t._id} disableGutters>
                      <ListItemText primary={t.title} secondary={`Was due ${new Date(t.deadline).toLocaleDateString()}`} />
                      <Chip label="Missed" size="small" color="error" />
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

export default WeeklyReviewPage;
