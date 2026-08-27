import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Paper, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  getClassSchedule, createClassSlot, createClassSlots, deleteClassSlot,
  parseSchedulePhoto, getSemesterDates, updateSemesterDates
} from '../services/api';
import AppShell from '../components/AppShell';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ClassSchedulePage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courseName, setCourseName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const [semesterStart, setSemesterStart] = useState('');
  const [semesterEnd, setSemesterEnd] = useState('');
  const [semesterSaved, setSemesterSaved] = useState(false);

  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStage, setOcrStage] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRows, setReviewRows] = useState([]);
  const [reviewSaving, setReviewSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClassSchedule();
      setSlots(data);
    } catch (err) {
      setError('Failed to load class schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    getSemesterDates()
      .then(({ data }) => {
        setSemesterStart(data.semester?.startDate ? data.semester.startDate.split('T')[0] : '');
        setSemesterEnd(data.semester?.endDate ? data.semester.endDate.split('T')[0] : '');
      })
      .catch(() => {});
  }, []);

  const handleSaveSemester = async () => {
    setError('');
    setSemesterSaved(false);
    try {
      await updateSemesterDates({ startDate: semesterStart || null, endDate: semesterEnd || null });
      setSemesterSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save semester dates');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!courseName) {
      setError('Please provide a course name');
      return;
    }
    try {
      await createClassSlot({ courseName, dayOfWeek: Number(dayOfWeek), startTime, endTime });
      setCourseName('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add class');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClassSlot(id);
      loadData();
    } catch (err) {
      setError('Failed to delete class');
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setOcrBusy(true);
    setOcrProgress(0);
    setOcrStage('Reading schedule photo…');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        }
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 10) {
        setError('Could not read any text from that photo. Try a clearer image or add classes manually.');
        return;
      }

      setOcrStage('Asking AI to structure the schedule…');
      const { data } = await parseSchedulePhoto(text);
      const rows = data.slots || [];

      if (rows.length === 0) {
        setError('No classes could be recognized in that photo. Try a clearer image or add classes manually.');
        return;
      }

      setReviewRows(rows);
      setReviewOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process that photo');
    } finally {
      setOcrBusy(false);
      setOcrStage('');
    }
  };

  const updateReviewRow = (index, field, value) => {
    setReviewRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeReviewRow = (index) => {
    setReviewRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmReview = async () => {
    setReviewSaving(true);
    setError('');
    try {
      await createClassSlots(reviewRows.map(({ courseName: cn, dayOfWeek: dw, startTime: st, endTime: et }) => ({
        courseName: cn, dayOfWeek: Number(dw), startTime: st, endTime: et
      })));
      setReviewOpen(false);
      setReviewRows([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save the extracted classes');
    } finally {
      setReviewSaving(false);
    }
  };

  const slotsByDay = DAYS.map((_, i) => slots.filter((s) => s.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime)));

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">📚 Class Schedule</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add your weekly timetable — Schedula factors your class hours into your daily capacity when
          judging your workload, shows classes on the Calendar, and makes sure AI-scheduled study time
          doesn't overlap class time.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Semester Dates</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Classes only count as busy time while your semester is running — set this once and it applies to every class below.
          </Typography>
          {semesterSaved && <Alert severity="success" sx={{ mb: 2 }}>Saved</Alert>}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 140 }}>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Start Date</Typography>
              <TextField type="date" fullWidth size="small" value={semesterStart} onChange={(e) => { setSemesterStart(e.target.value); setSemesterSaved(false); }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 140 }}>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>End Date</Typography>
              <TextField type="date" fullWidth size="small" value={semesterEnd} onChange={(e) => { setSemesterEnd(e.target.value); setSemesterSaved(false); }} inputProps={{ min: semesterStart || undefined }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button variant="outlined" onClick={handleSaveSemester}>Save</Button>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Class</Typography>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            disabled={ocrBusy}
            fullWidth
            sx={{ mb: 2 }}
          >
            {ocrBusy ? 'Reading photo…' : 'Upload Schedule Photo — let AI fill this in'}
            <input type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
          </Button>
          {ocrBusy && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">{ocrStage}{ocrProgress > 0 ? ` ${ocrProgress}%` : ''}</Typography>
              <LinearProgress variant={ocrProgress > 0 ? 'determinate' : 'indeterminate'} value={ocrProgress} sx={{ mt: 0.5 }} />
            </Box>
          )}

          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Course Name" fullWidth value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
            <FormControl fullWidth>
              <InputLabel>Day</InputLabel>
              <Select value={dayOfWeek} label="Day" onChange={(e) => setDayOfWeek(e.target.value)}>
                {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Start Time</Typography>
                <TextField type="time" fullWidth value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>End Time</Typography>
                <TextField type="time" fullWidth value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </Box>
            </Box>
            <Button type="submit" variant="contained">Add Class</Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          DAYS.map((day, i) => (
            <Paper key={day} sx={{ p: 2, mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: slotsByDay[i].length ? 1 : 0 }}>{day}</Typography>
              {slotsByDay[i].length === 0 ? (
                <Typography variant="body2" color="text.secondary">No classes</Typography>
              ) : (
                slotsByDay[i].map((slot) => (
                  <Box key={slot._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <Typography variant="body2">{slot.courseName} · {slot.startTime}–{slot.endTime}</Typography>
                    <IconButton size="small" onClick={() => handleDelete(slot._id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                ))
              )}
            </Paper>
          ))
        )}
      </Container>

      {/* Review dialog for AI-extracted classes from an uploaded photo */}
      <Dialog open={reviewOpen} onClose={() => !reviewSaving && setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Extracted Classes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Double-check what the AI read from your photo before adding these — fix anything wrong or remove a row entirely.
          </Typography>
          {reviewRows.map((row, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small" fullWidth label="Course Name"
                  value={row.courseName}
                  onChange={(e) => updateReviewRow(index, 'courseName', e.target.value)}
                />
                <IconButton size="small" onClick={() => removeReviewRow(index)}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1.4 }}>
                  <InputLabel>Day</InputLabel>
                  <Select value={row.dayOfWeek} label="Day" onChange={(e) => updateReviewRow(index, 'dayOfWeek', e.target.value)}>
                    {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" type="time" sx={{ flex: 1 }} value={row.startTime} onChange={(e) => updateReviewRow(index, 'startTime', e.target.value)} />
                <TextField size="small" type="time" sx={{ flex: 1 }} value={row.endTime} onChange={(e) => updateReviewRow(index, 'endTime', e.target.value)} />
              </Box>
              {!row.valid && <Chip label="Check this row — looks incomplete" size="small" color="warning" sx={{ alignSelf: 'flex-start' }} />}
            </Box>
          ))}
          {reviewRows.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nothing left to add.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)} disabled={reviewSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmReview}
            disabled={reviewSaving || reviewRows.length === 0}
          >
            {reviewSaving ? 'Adding…' : `Add ${reviewRows.length} Class${reviewRows.length === 1 ? '' : 'es'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default ClassSchedulePage;
