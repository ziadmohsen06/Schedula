const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { CohereClient } = require('cohere-ai');
const Task = require('../models/Task');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/audit');

const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Deterministically spreads `lessonCount` study sessions across the days between
// now and the deadline, splitting estimatedHours evenly per lesson. Used instead
// of the AI scheduler when the task specifies a lesson/lecture count.
const distributeLessons = (lessonCount, estimatedHours, deadline) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const days = Math.min(totalDays, lessonCount);
  const lessonsPerDay = Math.ceil(lessonCount / days);
  const hoursPerLesson = estimatedHours / lessonCount;

  const scheduledDays = [];
  let lessonsScheduled = 0;

  for (let d = 0; d < days && lessonsScheduled < lessonCount; d++) {
    const lessonsToday = Math.min(lessonsPerDay, lessonCount - lessonsScheduled);
    const date = new Date(start);
    date.setDate(date.getDate() + d);

    const firstLesson = lessonsScheduled + 1;
    const lastLesson = lessonsScheduled + lessonsToday;

    scheduledDays.push({
      date: toLocalISODate(date),
      hoursPerDay: Number((hoursPerLesson * lessonsToday).toFixed(1)),
      focus: lessonsToday > 1
        ? `Lessons ${firstLesson}-${lastLesson} of ${lessonCount}`
        : `Lesson ${firstLesson} of ${lessonCount}`
    });

    lessonsScheduled += lessonsToday;
  }

  return scheduledDays;
};

const scheduleTask = async (req, res) => {
  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY
  });

  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get user's daily start preference
    const user = await User.findById(req.user._id);
    const startPreference = user.dailyStartPreference || 'flexible';

    const startHourMap = {
      early: 8,
      mid: 10,
      late: 12,
      flexible: 9
    };

    const startHour = startHourMap[startPreference];
    const dailyHours = startPreference === 'early' ? 8 : 
                       startPreference === 'late' ? 6 : 7;

    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date(task.deadline).toISOString().split('T')[0];

    let scheduledDays = [];

    if (task.lessonCount && task.lessonCount > 0) {
      scheduledDays = distributeLessons(task.lessonCount, task.estimatedHours, task.deadline);
    } else try {
      if (process.env.COHERE_API_KEY) {
        const response = await cohere.chat({
          model: 'command-r7b-12-2024',
          message: `Create a daily schedule for this task:
Task: ${task.title}
Total hours needed: ${task.estimatedHours}
Start date: ${today}
Deadline: ${deadline}
Priority: ${task.priority}
User prefers to start at: ${startHour}:00
Daily working hours: ${dailyHours}

Return ONLY a JSON array, no other text:
[{"date":"YYYY-MM-DD","hoursPerDay":2,"focus":"what to do"}]
Total hours across all days must equal ${task.estimatedHours}.`
        });

        const text = response.text;
        const jsonMatch = text.match(/\[[\s\S]*?\]/);

        if (jsonMatch) {
          scheduledDays = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (aiError) {
      console.warn('AI schedule fallback used:', aiError.message);
    }

    if (!scheduledDays.length) {
      const start = new Date();
      const end = new Date(task.deadline);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      const hoursPerDay = Number((task.estimatedHours / days).toFixed(1));
      scheduledDays = Array.from({ length: Math.min(days, 3) }, (_, index) => ({
        date: new Date(start.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        hoursPerDay: index === Math.min(days, 3) - 1 ? Number((task.estimatedHours - (hoursPerDay * (Math.min(days, 3) - 1))).toFixed(1)) || hoursPerDay : hoursPerDay,
        focus: index === 0 ? 'Focus on the highest-priority work' : 'Continue steadily'
      }));
    }
    task.scheduledDays = scheduledDays;
    await task.save();

    await logAuditEvent(req.user._id, 'task scheduled with AI', req);

    res.status(200).json({ message: 'Task scheduled successfully', task });
  } catch (error) {
    console.error('Cohere error:', error.message);
    res.status(500).json({ message: 'Unable to process request' });
  }
};

module.exports = { scheduleTask };