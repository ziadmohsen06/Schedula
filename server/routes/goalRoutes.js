const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Goal = require('../models/Goal');

// Splits the time between now and the target date into one milestone per week.
const generateWeeklyMilestones = (title, targetDate) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const totalWeeks = Math.max(1, Math.round(totalDays / 7));

  return Array.from({ length: totalWeeks }, (_, i) => {
    const weekNum = i + 1;
    const dayOffset = Math.min((i + 1) * 7 - 1, totalDays - 1);
    const target = new Date(start);
    target.setDate(target.getDate() + dayOffset);

    let label;
    if (weekNum === totalWeeks) label = `Week ${weekNum}: Finalize and review "${title}"`;
    else if (weekNum === 1) label = `Week ${weekNum}: Get started on "${title}"`;
    else label = `Week ${weekNum}: Keep building on "${title}"`;

    return { title: label, targetDate: target, completed: false };
  });
};

router.get('/', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ targetDate: 1 });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, targetDate } = req.body;

    if (!title || !targetDate) {
      return res.status(400).json({ message: 'Please provide a title and target date' });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title,
      description,
      targetDate,
      milestones: generateWeeklyMilestones(title, targetDate)
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create goal' });
  }
});

router.patch('/:id/milestones/:milestoneId', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    milestone.completed = !milestone.completed;
    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update milestone' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Goal.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete goal' });
  }
});

module.exports = router;
