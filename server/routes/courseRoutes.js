const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Course = require('../models/Course');

// GPA + attention list (must be registered before /:id-style routes below)
router.get('/gpa', protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id });
    const graded = courses.filter((c) => c.grade && Course.GRADE_POINTS[c.grade] !== undefined);

    let totalPoints = 0;
    let totalCredits = 0;
    graded.forEach((c) => {
      totalPoints += Course.GRADE_POINTS[c.grade] * c.credits;
      totalCredits += c.credits;
    });

    const gpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : null;

    const needsAttention = graded
      .filter((c) => Course.GRADE_POINTS[c.grade] < 3.0)
      .sort((a, b) => Course.GRADE_POINTS[a.grade] - Course.GRADE_POINTS[b.grade])
      .map((c) => ({ _id: c._id, name: c.name, grade: c.grade, credits: c.credits }));

    res.status(200).json({ gpa, totalCredits, gradedCount: graded.length, needsAttention });
  } catch (error) {
    res.status(500).json({ message: 'Failed to compute GPA' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, credits, grade, semester } = req.body;

    if (!name || !credits) {
      return res.status(400).json({ message: 'Please provide course name and credits' });
    }

    const course = await Course.create({
      user: req.user._id,
      name,
      credits,
      grade: grade || null,
      semester
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, credits, grade, semester } = req.body;
    if (name !== undefined) course.name = name;
    if (credits !== undefined) course.credits = credits;
    if (grade !== undefined) course.grade = grade || null;
    if (semester !== undefined) course.semester = semester;

    await course.save();
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

module.exports = router;
