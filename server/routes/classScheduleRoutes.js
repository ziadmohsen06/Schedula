const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const router = express.Router();
const { CohereClient } = require('cohere-ai');
const protect = require('../middleware/authMiddleware');
const ClassSlot = require('../models/ClassSlot');

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateSlotShape = (slot) => {
  if (!slot || typeof slot !== 'object') return 'Invalid entry';
  const { courseName, dayOfWeek, startTime, endTime } = slot;
  if (!courseName || typeof courseName !== 'string') return 'Missing course name';
  if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6) return 'Invalid day';
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return 'Invalid time format';
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return 'End time must be after start time';
  return null;
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

// Bulk-create after the user reviews/edits the AI-extracted rows from an
// uploaded schedule photo. Invalid rows are skipped rather than failing the
// whole batch, so one bad OCR read doesn't block the rest of the schedule.
router.post('/bulk', protect, async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one class slot' });
    }

    const valid = [];
    let skipped = 0;
    for (const slot of slots.slice(0, 50)) {
      if (validateSlotShape(slot)) { skipped++; continue; }
      valid.push({
        user: req.user._id,
        courseName: slot.courseName,
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime
      });
    }

    if (valid.length === 0) {
      return res.status(400).json({ message: 'None of the provided entries were valid' });
    }

    const created = await ClassSlot.insertMany(valid);
    res.status(201).json({ created, skipped });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create class slots' });
  }
});

// Takes raw OCR'd text (extracted client-side from an uploaded schedule
// photo, so the free-tier server never has to run image processing itself)
// and asks Cohere to structure it into class-slot candidates. Nothing is
// saved here — the client shows an editable review table and the user
// confirms via POST /bulk, since OCR+AI extraction from a photo is often
// imperfect and shouldn't silently commit wrong class times.
router.post('/parse', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return res.status(400).json({ message: 'No readable text found in that image' });
    }

    if (!process.env.COHERE_API_KEY) {
      return res.status(503).json({ message: 'AI schedule parsing is not configured' });
    }

    const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: `The following text was OCR-scanned from a photo of a weekly class timetable. It may be messy, have misread characters, or jumbled spacing. Extract every class you can confidently identify.

OCR text:
"""
${text.slice(0, 4000)}
"""

Return ONLY a JSON array, no other text, no markdown fences:
[{"courseName":"Calculus II","dayOfWeek":1,"startTime":"09:00","endTime":"10:30"}]

Rules:
- dayOfWeek is 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- startTime/endTime must be 24-hour "HH:MM"
- Skip anything you can't confidently read — do not guess times
- If nothing looks like a class schedule, return []`
    });

    const jsonMatch = response.text.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const results = parsed.slice(0, 50).map((slot) => ({
      courseName: slot.courseName || '',
      dayOfWeek: Number(slot.dayOfWeek),
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      valid: !validateSlotShape(slot)
    }));

    res.status(200).json({ slots: results });
  } catch (error) {
    console.warn('Schedule photo parse failed:', error.message);
    res.status(500).json({ message: 'Could not read a schedule from that image. Try adding classes manually.' });
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
