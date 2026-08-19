const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const protect = authMiddleware.protect || authMiddleware;

// Get all active tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      user: req.user._id,
      status: { $ne: 'completed' }
    }).sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get completed tasks (history)
router.get('/history', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { 
      user: req.user._id,
      status: 'completed'
    };
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const skip = (page - 1) * limit;
    
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Task.countDocuments(query);
    
    res.status(200).json({
      tasks,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// Create task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, deadline, priority, estimatedHours, tags } = req.body;
    
    if (!title || !deadline) {
      return res.status(400).json({ message: 'Please provide title and deadline' });
    }
    
    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      deadline,
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 1,
      tags: tags || ['Other']
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// Complete task
router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    task.status = 'completed';
    await task.save();
    
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete task' });
  }
});

// Reschedule task
router.patch('/:id/reschedule', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const { deadline, priority } = req.body;
    
    if (deadline) task.deadline = new Date(deadline);
    if (priority) task.priority = priority;
    
    task.scheduledDays = [];
    await task.save();
    
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reschedule task' });
  }
});

// Add note to task
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }
    
    task.notes.push({ text: text.trim() });
    await task.save();
    
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add note' });
  }
});

module.exports = router;