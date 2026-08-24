const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Habit = require('../models/Habit');

const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Consecutive days ending today (or yesterday, if today isn't checked off yet
// so an in-progress streak doesn't look broken before the day is over).
const calculateStreak = (completedDates) => {
  const dateSet = new Set(completedDates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!dateSet.has(toLocalISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(toLocalISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const serializeHabit = (habit) => {
  const today = toLocalISODate(new Date());
  return {
    _id: habit._id,
    name: habit.name,
    emoji: habit.emoji,
    streak: calculateStreak(habit.completedDates),
    completedToday: habit.completedDates.includes(today)
  };
};

router.get('/', protect, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json(habits.map(serializeHabit));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch habits' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a habit name' });
    }

    const habit = await Habit.create({ user: req.user._id, name, emoji: emoji || '✅' });
    res.status(201).json(serializeHabit(habit));
  } catch (error) {
    res.status(500).json({ message: 'Failed to create habit' });
  }
});

router.post('/:id/toggle', protect, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const today = toLocalISODate(new Date());
    if (habit.completedDates.includes(today)) {
      habit.completedDates = habit.completedDates.filter((d) => d !== today);
    } else {
      habit.completedDates.push(today);
    }

    await habit.save();
    res.status(200).json(serializeHabit(habit));
  } catch (error) {
    res.status(500).json({ message: 'Failed to update habit' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    if (habit.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Habit.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete habit' });
  }
});

module.exports = router;
