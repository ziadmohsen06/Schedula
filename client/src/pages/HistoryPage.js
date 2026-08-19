import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Paper, CircularProgress, TextField, Pagination } from '@mui/material';
import AppShell from '../components/AppShell';
import { getCompletedTasks } from '../services/api';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const limit = 10;

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChanged', sync);
    return () => window.removeEventListener('darkModeChanged', sync);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await getCompletedTasks({ page, limit, q });
        setHistory(data.tasks || []);
        setPages(data.pages || 1);
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, q]);

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Task History</Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            placeholder="Search history"
            size="small"
            fullWidth
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </Box>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : history.length === 0 ? (
          <Typography color="text.secondary">No completed tasks yet.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {history.map((item) => (
              <Paper key={item._id} sx={{ p: 2 }}>
                <Typography variant="h6">{item.title}</Typography>
                <Typography color="text.secondary">
                  Completed on {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                </Typography>
                <Typography color="success.main" sx={{ mt: 0.5 }}>{item.status}</Typography>
                {item.description && (
                  <Typography sx={{ mt: 1 }} color="text.secondary">{item.description}</Typography>
                )}
              </Paper>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={(_, v) => setPage(v)}
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: darkMode ? '#fff' : 'inherit',
                    borderColor: darkMode ? '#555' : 'inherit'
                  },
                  '& .MuiPaginationItem-root.Mui-selected': {
                    bgcolor: darkMode ? '#1976d2' : 'primary.main',
                    color: '#fff'
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Container>
    </AppShell>
  );
};

export default HistoryPage;