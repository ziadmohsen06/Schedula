const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Assignment = require('../models/Assignment');

router.get('/', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ user: req.user._id }).sort({ deadline: 1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { courseName, title, weightPercentage, submissionLink, deadline } = req.body;

    if (!courseName || !title || !deadline) {
      return res.status(400).json({ message: 'Please provide course name, title, and deadline' });
    }

    const assignment = await Assignment.create({
      user: req.user._id,
      courseName,
      title,
      weightPercentage,
      submissionLink,
      deadline
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (assignment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { courseName, title, weightPercentage, submissionLink, deadline, grade, status } = req.body;
    if (courseName !== undefined) assignment.courseName = courseName;
    if (title !== undefined) assignment.title = title;
    if (weightPercentage !== undefined) assignment.weightPercentage = weightPercentage;
    if (submissionLink !== undefined) assignment.submissionLink = submissionLink;
    if (deadline !== undefined) assignment.deadline = deadline;
    if (grade !== undefined) {
      assignment.grade = grade;
      assignment.status = 'graded';
    }
    if (status !== undefined) assignment.status = status;

    await assignment.save();
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update assignment' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (assignment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

module.exports = router;
