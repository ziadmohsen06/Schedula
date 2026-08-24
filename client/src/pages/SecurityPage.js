import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper, Divider, Chip,
  LinearProgress, List, ListItem, ListItemText, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Skeleton
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import DevicesIcon from '@mui/icons-material/Devices';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {
  getSecurityScore, getLoginHistory, getSessions, revokeSession,
  exportAccountData, deleteAccount
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

const scoreColor = (score) => {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
};

const SecurityPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [score, setScore] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scoreRes, historyRes, sessionsRes] = await Promise.all([
        getSecurityScore(),
        getLoginHistory(),
        getSessions()
      ]);
      setScore(scoreRes.data);
      setLoginHistory(historyRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      setError('Failed to load security information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRevoke = async (id) => {
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError('Failed to revoke session');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportAccountData();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'schedula-data-export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export account data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Security</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Skeleton variant="text" width="30%" height={32} />
              <Skeleton variant="rounded" height={10} sx={{ my: 2 }} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="50%" />
            </Paper>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Skeleton variant="text" width="35%" height={32} sx={{ mb: 2 }} />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
              ))}
            </Paper>
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ShieldIcon color="action" />
                <Typography variant="body1" fontWeight="medium">Security Score</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">{score?.score ?? 0}</Typography>
                <Typography variant="body2" color="text.secondary">/ 100</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={score?.score ?? 0}
                color={scoreColor(score?.score ?? 0)}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Two-Factor Authentication</Typography>
                <Chip
                  label={score?.breakdown?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  color={score?.breakdown?.twoFactorEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Password Strength</Typography>
                <Typography variant="body2">{score?.breakdown?.passwordStrength ?? 0} / 100</Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <DevicesIcon color="action" />
                <Typography variant="body1" fontWeight="medium">Active Sessions</Typography>
              </Box>
              {sessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No active sessions found.</Typography>
              ) : (
                <List disablePadding>
                  {sessions.map((s, i) => (
                    <React.Fragment key={s._id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        disableGutters
                        secondaryAction={
                          s.current ? (
                            <Chip label="This device" color="primary" size="small" />
                          ) : (
                            <Button size="small" color="error" onClick={() => handleRevoke(s._id)}>
                              Revoke
                            </Button>
                          )
                        }
                      >
                        <ListItemText
                          primary={s.device}
                          secondary={`${s.ipAddress} · last active ${new Date(s.lastActiveAt).toLocaleString()}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <HistoryIcon color="action" />
                <Typography variant="body1" fontWeight="medium">Login History</Typography>
              </Box>
              {loginHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>No login history yet.</Typography>
              ) : (
                <List disablePadding>
                  {loginHistory.map((h, i) => (
                    <React.Fragment key={h._id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        disableGutters
                        secondaryAction={h.warning && (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="Unusual"
                            color="warning"
                            size="small"
                          />
                        )}
                      >
                        <ListItemText
                          primary={h.device}
                          secondary={`${h.ipAddress} · ${new Date(h.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.main' }}>
              <Typography variant="body1" fontWeight="medium" color="error" sx={{ mb: 2 }}>Danger Zone</Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">Export your data</Typography>
                  <Typography variant="body2" color="text.secondary">Download all your account data as a JSON file</Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" color="error">Delete account</Typography>
                  <Typography variant="body2" color="text.secondary">Permanently delete your account and all data</Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          </>
        )}

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This permanently deletes your account, tasks, and all associated data. This cannot be undone.
              Enter your password to confirm.
            </Typography>
            {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
            <TextField
              type="password"
              label="Password"
              fullWidth
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
};

export default SecurityPage;
