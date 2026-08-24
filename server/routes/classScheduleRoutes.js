const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const ClassSlot = require('../models/ClassSlot');

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

router.get('/', protect, async (req, res) => {
  try {
    const slots = await ClassSlot.find({ user: req.user._id }).sort({ dayOfWeek: 1, startTime: 1 });
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch class schedule' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { courseName, dayOfWeek, startTime, endTime } = req.body;

    if (!courseName || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide course name, day, start time, and end time' });
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const slot = await ClassSlot.create({
      user: req.user._id,
      courseName,
      dayOfWeek,
      startTime,
      endTime
    });

    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create class slot' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const slot = await ClassSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: 'Class slot not found' });
    }
    if (slot.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await ClassSlot.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Class slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete class slot' });
  }
});

module.exports = router;
