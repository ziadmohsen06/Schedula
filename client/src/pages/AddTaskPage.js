import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Chip, OutlinedInput
} from '@mui/material';
import { createTask, scheduleTask } from '../services/api';
import AppShell from '../components/AppShell';
import { getTagColor } from '../utils/tagColors';

const TAGS = ['University', 'School', 'Test', 'Work', 'Personal', 'Gym', 'Errands', 'Other'];
const STUDY_TAGS = ['University', 'School', 'Test'];

const TASK_TEMPLATES = [
  { label: '🎓 University Assignment', tags: ['University'], priority: 'high', estimatedHours: 3 },
  { label: '📝 Exam Prep', tags: ['Test'], priority: 'urgent', estimatedHours: 4 },
  { label: '💼 Work Task', tags: ['Work'], priority: 'medium', estimatedHours: 2 },
  { label: '🏋️ Gym Session', tags: ['Gym'], priority: 'low', estimatedHours: 1 },
  { label: '🏃 Errand', tags: ['Errands'], priority: 'low', estimatedHours: 1 }
];

const AddTaskPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [tags, setTags] = useState(['Other']);
  const [lessonCount, setLessonCount] = useState('');
  const [studyStrategy, setStudyStrategy] = useState('none');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isStudyTask = tags.some((tag) => STUDY_TAGS.includes(tag));
  const isExamTask = tags.includes('Test');

  const applyTemplate = (template) => {
    setTags(template.tags);
    setPriority(template.priority);
    setEstimatedHours(template.estimatedHours);
  };

  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const local = new Date(today.getTime() - offset * 60 * 1000);
    return local.toISOString().split('T')[0];
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!title || !deadline) {
        setError('Please provide title and deadline');
        return;
      }

      const selectedDate = new Date(deadline);
      const today = new Date(getTodayString());
      if (selectedDate < today) {
        setError('Deadline cannot be in the past');
        return;
      }

      const payload = {
        title,
        description,
        deadline,
        priority,
        estimatedHours: Number(estimatedHours || 1),
        tags
      };

      if (isStudyTask && studyStrategy === 'examCountdown' && isExamTask) {
        payload.examCountdown = true;
      } else if (isStudyTask && studyStrategy === 'studyMode') {
        payload.studyMode = true;
      } else if (isStudyTask && studyStrategy === 'lessons' && Number(lessonCount) > 0) {
        payload.lessonCount = Number(lessonCount);
      }

      if (recurrenceFrequency !== 'none') {
        payload.recurrence = { frequency: recurrenceFrequency };
        if (recurrenceEndDate) {
          payload.recurrence.endDate = recurrenceEndDate;
        }
      }

      const { data } = await createTask(payload);

      if (data._id) {
        try {
          await scheduleTask(data._id);
        } catch (scheduleErr) {
          // ignore schedule errors; task creation still succeeded
        }
        setSuccess('Task added successfully. AI scheduling has been prepared.');
      } else {
        setSuccess(`${data.count} recurring tasks added successfully.`);
      }

      setTitle('');
      setDescription('');
      setDeadline('');
      setPriority('medium');
      setEstimatedHours(1);
      setTags(['Other']);
      setLessonCount('');
      setStudyStrategy('none');
      setRecurrenceFrequency('none');
      setRecurrenceEndDate('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">Add New Task</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Quick templates</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {TASK_TEMPLATES.map((template) => (
              <Chip
                key={template.label}
                label={template.label}
                onClick={() => applyTemplate(template)}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        <Box component="form" onSubmit={handleAddTask} sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Deadline</Typography>
            <TextField type="date" fullWidth value={deadline} onChange={(e) => setDeadline(e.target.value)} inputProps={{ min: getTodayString() }} required />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Estimated Hours" type="number" fullWidth value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} inputProps={{ min: 1 }} />
          </Box>
          
          <FormControl fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              multiple
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              input={<OutlinedInput label="Tags" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      sx={{
                        bgcolor: `${getTagColor(value)}20`,
                        color: getTagColor(value),
                        border: `1px solid ${getTagColor(value)}`
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {TAGS.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isStudyTask && (
            <FormControl fullWidth>
              <InputLabel>Study Scheduling</InputLabel>
              <Select value={studyStrategy} label="Study Scheduling" onChange={(e) => setStudyStrategy(e.target.value)}>
                <MenuItem value="none">Default (even split)</MenuItem>
                <MenuItem value="lessons">Split by lesson count</MenuItem>
                <MenuItem value="studyMode">Study Mode (Study → Review → Practice)</MenuItem>
                {isExamTask && <MenuItem value="examCountdown">Exam Countdown (ramps up as the exam nears)</MenuItem>}
              </Select>
            </FormControl>
          )}

          {isStudyTask && studyStrategy === 'lessons' && (
            <TextField
              label="Number of lessons/lectures to study"
              type="number"
              fullWidth
              value={lessonCount}
              onChange={(e) => setLessonCount(e.target.value)}
              inputProps={{ min: 1 }}
              helperText="We'll split your estimated hours evenly across this many study sessions"
            />
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Repeat</InputLabel>
              <Select value={recurrenceFrequency} label="Repeat" onChange={(e) => setRecurrenceFrequency(e.target.value)}>
                <MenuItem value="none">Does not repeat</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            {recurrenceFrequency !== 'none' && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Repeat until (optional)</Typography>
                <TextField
                  type="date"
                  fullWidth
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  inputProps={{ min: deadline || getTodayString() }}
                />
              </Box>
            )}
          </Box>

          <Button type="submit" variant="contained" size="large">Add Task</Button>
        </Box>
      </Container>
    </AppShell>
  );
};

export default AddTaskPage;