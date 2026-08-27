import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Alert
} from '@mui/material';
import { updateTask } from '../services/api';

const TAG_OPTIONS = ['University', 'School', 'Test', 'Work', 'Personal', 'Gym', 'Errands', 'Other'];

// "2026-08-27T14:30" for a datetime-local input, in the user's local time
const toDateTimeLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = { title: '', description: '', deadline: '', priority: 'medium', estimatedHours: 1, tags: [] };

/**
 * Reusable "edit every field of a task" dialog.
 * onSaved receives the updated task from the API — callers can merge it or refetch.
 */
const EditTaskDialog = ({ open, task, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        deadline: toDateTimeLocal(task.deadline),
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours ?? 1,
        tags: task.tags || [],
      });
      setError('');
    }
  }, [open, task]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.deadline) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await updateTask(task._id, {
        title: form.title.trim(),
        description: form.description,
        deadline: new Date(form.deadline).toISOString(),
        priority: form.priority,
        estimatedHours: Number(form.estimatedHours),
        tags: form.tags.length ? form.tags : ['Other'],
      });
      onSaved?.(data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            error={!form.title.trim()}
            helperText={!form.title.trim() ? 'Title is required' : ''}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Deadline</Typography>
            <TextField
              type="datetime-local"
              fullWidth
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              required
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={form.priority}
              label="Priority"
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Estimated Hours"
            type="number"
            fullWidth
            inputProps={{ min: 0.5, step: 0.5 }}
            value={form.estimatedHours}
            onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              multiple
              value={form.tags}
              label="Tags"
              onChange={(e) => setForm((f) => ({ ...f, tags: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}
            >
              {TAG_OPTIONS.map((tag) => (
                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.deadline}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTaskDialog;
