const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { CohereClient } = require('cohere-ai');
const Task = require('../models/Task');
const User = require('../models/User');
const ClassSlot = require('../models/ClassSlot');
const Assignment = require('../models/Assignment');
const Goal = require('../models/Goal');
const { logAuditEvent } = require('../utils/audit');

// A same-day mood check-in nudges scheduling to be gentler — fewer hours to
// pack into a stressed/tired day, and a lower bar before the burnout warning
// fires — instead of only coloring the Dashboard's briefing text.
const moodCapacityAdjustment = (user) => {
  const checkIn = user.lastMoodCheckIn;
  if (!checkIn?.mood || checkIn.date !== toLocalISODate(new Date())) return 0;
  if (checkIn.mood === 'stressed') return -2;
  if (checkIn.mood === 'tired') return -1;
  return 0;
};

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Total scheduled class hours for a given weekday (0=Sunday), so workload
// calculations can treat class time as unavailable study capacity.
const classHoursByWeekday = (classSlots) => {
  const hoursByDay = new Map();
  classSlots.forEach((slot) => {
    const hours = (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60;
    hoursByDay.set(slot.dayOfWeek, (hoursByDay.get(slot.dayOfWeek) || 0) + hours);
  });
  return hoursByDay;
};

const PRIORITY_HOUR_MAP = { urgent: 8, high: 10, medium: 13, low: 16 };

const isHourBusy = (hour, dayClasses) => dayClasses.some((c) => {
  const start = timeToMinutes(c.startTime) / 60;
  const end = timeToMinutes(c.endTime) / 60;
  return hour < end && hour + 1 > start;
});

// Picks an hour (7-20, matching the calendar's hour grid) for a scheduled day
// that doesn't fall inside any of the user's classes that weekday, searching
// outward from the priority-based preferred hour so the AI-picked slot still
// leans toward the same time-of-day it would have used anyway. Returns null
// if every hour that day is class time — the calendar then falls back to its
// existing priority-hour default, same as any other unscheduled-hour task.
const findFreeHour = (date, classSlots, priority) => {
  const dow = date.getDay();
  const dayClasses = classSlots.filter((c) => c.dayOfWeek === dow);
  const preferred = PRIORITY_HOUR_MAP[priority] || 13;
  if (dayClasses.length === 0) return preferred;
  if (!isHourBusy(preferred, dayClasses)) return preferred;

  for (let offset = 1; offset <= 13; offset++) {
    for (const h of [preferred - offset, preferred + offset]) {
      if (h >= 7 && h <= 20 && !isHourBusy(h, dayClasses)) return h;
    }
  }
  return null;
};

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

// Splits a task into Study -> Review -> Practice sessions with widening gaps
// between them (a simplified spaced-repetition pattern: recall is tested again
// just as it starts to fade, then once more before the deadline). Falls back to
// merging phases onto the same day when the deadline is too close to space them out.
const generateStudyModeSchedule = (estimatedHours, deadline) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const lastDayOffset = totalDays - 1;

  const phases = [
    { label: 'Study', dayOffset: 0, weight: 0.5 },
    { label: 'Review', dayOffset: Math.min(2, lastDayOffset), weight: 0.3 },
    { label: 'Practice', dayOffset: Math.min(5, lastDayOffset), weight: 0.2 }
  ];

  const byDay = new Map();

  phases.forEach((phase) => {
    const date = new Date(start);
    date.setDate(date.getDate() + phase.dayOffset);
    const key = toLocalISODate(date);
    const hours = Number((estimatedHours * phase.weight).toFixed(1));

    if (byDay.has(key)) {
      const existing = byDay.get(key);
      existing.hoursPerDay = Number((existing.hoursPerDay + hours).toFixed(1));
      existing.focus = `${existing.focus} + ${phase.label}`;
    } else {
      byDay.set(key, { date: key, hoursPerDay: hours, focus: phase.label });
    }
  });

  return Array.from(byDay.values());
};

// A bounded revision countdown: covers at most the last MAX_COUNTDOWN_DAYS before
// the exam, ramping hours up day-by-day so the heaviest revision lands right
// before the deadline instead of being spread flat across the whole gap.
const MAX_COUNTDOWN_DAYS = 14;

const generateExamCountdownSchedule = (estimatedHours, deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);

  const daysUntilExam = Math.max(1, Math.floor((end - today) / (1000 * 60 * 60 * 24)) + 1);
  const countdownDays = Math.min(daysUntilExam, MAX_COUNTDOWN_DAYS);

  const start = new Date(end);
  start.setDate(start.getDate() - (countdownDays - 1));
  const actualStart = start < today ? today : start;
  const actualDays = Math.floor((end - actualStart) / (1000 * 60 * 60 * 24)) + 1;

  const weights = Array.from({ length: actualDays }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let allocated = 0;

  return weights.map((weight, i) => {
    const date = new Date(actualStart);
    date.setDate(date.getDate() + i);
    const isLast = i === actualDays - 1;
    const hours = isLast
      ? Number(Math.max(0, estimatedHours - allocated).toFixed(1))
      : Number(((estimatedHours * weight) / weightSum).toFixed(1));
    allocated += hours;

    const daysLeft = actualDays - i - 1;
    return {
      date: toLocalISODate(date),
      hoursPerDay: hours,
      focus: daysLeft === 0 ? 'Final review before the exam' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left — ramp up revision`
    };
  }).filter((day) => day.hoursPerDay > 0);
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
    const baseDailyHours = startPreference === 'early' ? 8 :
                       startPreference === 'late' ? 6 : 7;
    const dailyHours = Math.max(2, baseDailyHours + moodCapacityAdjustment(user));

    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date(task.deadline).toISOString().split('T')[0];

    let scheduledDays = [];

    if (task.examCountdown) {
      scheduledDays = generateExamCountdownSchedule(task.estimatedHours, task.deadline);
    } else if (task.studyMode) {
      scheduledDays = generateStudyModeSchedule(task.estimatedHours, task.deadline);
    } else if (task.lessonCount && task.lessonCount > 0) {
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
    const classSlots = await ClassSlot.find({ user: req.user._id });
    task.scheduledDays = scheduledDays.map((day) => ({
      ...day,
      hour: findFreeHour(new Date(day.date), classSlots, task.priority)
    }));
    await task.save();

    await logAuditEvent(req.user._id, 'task scheduled with AI', req);

    res.status(200).json({ message: 'Task scheduled successfully', task });
  } catch (error) {
    console.error('Cohere error:', error.message);
    res.status(500).json({ message: 'Unable to process request' });
  }
};

// Compares each of the next 7 days' already-scheduled hours (summed across all
// active tasks' scheduledDays) against the user's normal daily capacity (derived
// from their daily-start preference, same mapping used when scheduling a task).
// Flags burnout risk when several days are overloaded, or one day is way over.
const getWorkloadInsights = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const startPreference = user.dailyStartPreference || 'flexible';
    const baseDailyCapacity = startPreference === 'early' ? 8 : startPreference === 'late' ? 6 : 7;
    const dailyCapacity = Math.max(2, baseDailyCapacity + moodCapacityAdjustment(user));

    const tasks = await Task.find({ user: req.user._id, status: { $ne: 'completed' } });
    const classSlots = await ClassSlot.find({ user: req.user._id });
    const classHours = classHoursByWeekday(classSlots);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = tasks.filter((t) => new Date(t.deadline) < today).length;
    const HORIZON_DAYS = 7;
    const horizonEnd = new Date(today);
    horizonEnd.setDate(horizonEnd.getDate() + HORIZON_DAYS);

    // Assignments and goal milestones don't have scheduled study hours of their
    // own, but a submission due that day is still real pressure — count it as
    // extra load so the burnout detector isn't blind to deadlines that live
    // outside the Task/AI-scheduling system entirely.
    const [assignments, goals] = await Promise.all([
      Assignment.find({ user: req.user._id, status: { $ne: 'graded' }, deadline: { $gte: today, $lt: horizonEnd } }),
      Goal.find({ user: req.user._id, 'milestones.completed': false, 'milestones.targetDate': { $gte: today, $lt: horizonEnd } })
    ]);
    const ASSIGNMENT_LOAD_HOURS = 2;
    const MILESTONE_LOAD_HOURS = 1;

    const dayTotals = new Map();
    const dayWeekdays = new Map();
    const dayAssignments = new Map();
    const dayMilestones = new Map();
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = toLocalISODate(d);
      dayTotals.set(key, 0);
      dayWeekdays.set(key, d.getDay());
      dayAssignments.set(key, 0);
      dayMilestones.set(key, 0);
    }

    tasks.forEach((task) => {
      (task.scheduledDays || []).forEach((entry) => {
        const key = toLocalISODate(new Date(entry.date));
        if (dayTotals.has(key)) {
          dayTotals.set(key, Number((dayTotals.get(key) + (entry.hoursPerDay || 0)).toFixed(1)));
        }
      });
    });

    assignments.forEach((a) => {
      const key = toLocalISODate(new Date(a.deadline));
      if (dayTotals.has(key)) {
        dayTotals.set(key, Number((dayTotals.get(key) + ASSIGNMENT_LOAD_HOURS).toFixed(1)));
        dayAssignments.set(key, dayAssignments.get(key) + 1);
      }
    });

    goals.forEach((goal) => {
      goal.milestones.forEach((m) => {
        if (m.completed || !m.targetDate) return;
        const key = toLocalISODate(new Date(m.targetDate));
        if (dayTotals.has(key)) {
          dayTotals.set(key, Number((dayTotals.get(key) + MILESTONE_LOAD_HOURS).toFixed(1)));
          dayMilestones.set(key, dayMilestones.get(key) + 1);
        }
      });
    });

    const days = Array.from(dayTotals.entries()).map(([date, hours]) => {
      const classHoursToday = Number((classHours.get(dayWeekdays.get(date)) || 0).toFixed(1));
      const freeCapacity = Math.max(0, Number((dailyCapacity - classHoursToday).toFixed(1)));
      return {
        date,
        hours,
        classHours: classHoursToday,
        assignmentsDue: dayAssignments.get(date) || 0,
        milestonesDue: dayMilestones.get(date) || 0,
        freeCapacity,
        overloaded: hours > freeCapacity
      };
    });

    const overloadedCount = days.filter((d) => d.overloaded).length;
    const peakDay = days.reduce((max, d) => (d.hours > (max?.hours || 0) ? d : max), null);

    const scheduleOverloaded = overloadedCount >= 3 || (peakDay && peakDay.hours > peakDay.freeCapacity * 1.5);
    const overdueOverloaded = overdueCount >= 5 || (tasks.length > 0 && overdueCount / tasks.length > 0.5);

    let severity = null;
    let title = null;
    let suggestion = null;

    const peakDayLoadNote = peakDay && (peakDay.assignmentsDue > 0 || peakDay.milestonesDue > 0)
      ? ` (includes ${[
          peakDay.assignmentsDue > 0 ? `${peakDay.assignmentsDue} assignment${peakDay.assignmentsDue === 1 ? '' : 's'} due` : null,
          peakDay.milestonesDue > 0 ? `${peakDay.milestonesDue} goal milestone${peakDay.milestonesDue === 1 ? '' : 's'} due` : null
        ].filter(Boolean).join(' and ')})`
      : '';

    if (scheduleOverloaded || overdueOverloaded) {
      severity = 'error';
      title = '🔥 Burnout Risk';
      const parts = [];
      if (scheduleOverloaded) {
        parts.push(`${overloadedCount} day${overloadedCount === 1 ? '' : 's'} this week over your available capacity (peaking at ${peakDay.hours}h on ${peakDay.date}, ${peakDay.freeCapacity}h free that day${peakDayLoadNote})`);
      }
      if (overdueOverloaded) {
        parts.push(`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`);
      }
      suggestion = `Your workload looks heavy — ${parts.join(' and ')}. Consider enabling Lazy Mode or rescheduling some lower-priority tasks.`;
    } else if (overdueCount >= 3 || (peakDay && peakDay.overloaded)) {
      severity = 'warning';
      title = '⚠️ Workload Warning';
      suggestion = overdueCount > 0
        ? `You have ${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}. Take a break and tackle them one at a time.`
        : `${peakDay.date} is scheduled at ${peakDay.hours}h, over your ${peakDay.freeCapacity}h free that day (after classes)${peakDayLoadNote}. Consider spreading it out.`;
    } else if (overdueCount > 0) {
      severity = 'info';
      title = '💡 Heads Up';
      suggestion = `You have ${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}. Try to complete ${overdueCount === 1 ? 'it' : 'them'} soon.`;
    }

    const burnoutRisk = severity === 'error';

    res.status(200).json({
      dailyCapacity, days, overloadedCount, overdueCount,
      burnoutRisk, severity, title, suggestion
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to compute workload insights' });
  }
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Deterministic pattern detection: groups all tasks by (tag, weekday-of-deadline)
// and flags combinations with a high miss rate (overdue and never completed),
// suggesting a weekday for that tag with a lower miss rate as an alternative.
const getSmartSuggestions = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = new Map();
    tasks.forEach((task) => {
      const weekday = new Date(task.deadline).getDay();
      const missed = task.status !== 'completed' && new Date(task.deadline) < today;
      (task.tags || []).forEach((tag) => {
        const key = `${tag}|${weekday}`;
        if (!groups.has(key)) groups.set(key, { tag, weekday, total: 0, missed: 0 });
        const g = groups.get(key);
        g.total += 1;
        if (missed) g.missed += 1;
      });
    });

    const allGroups = Array.from(groups.values());
    const candidates = allGroups
      .filter((g) => g.total >= 2 && g.missed / g.total >= 0.5)
      .sort((a, b) => (b.missed / b.total) - (a.missed / a.total));

    const suggestions = candidates.slice(0, 3).map((g) => {
      const otherDays = allGroups.filter((o) => o.tag === g.tag && o.weekday !== g.weekday);
      const better = otherDays.sort((a, b) => (a.missed / a.total) - (b.missed / b.total))[0];
      const suggestedDay = better ? WEEKDAY_NAMES[better.weekday] : WEEKDAY_NAMES[(g.weekday + 1) % 7];

      return {
        tag: g.tag,
        day: WEEKDAY_NAMES[g.weekday],
        missedCount: g.missed,
        totalCount: g.total,
        message: `You tend to miss ${g.tag} tasks scheduled on ${WEEKDAY_NAMES[g.weekday]}s (${g.missed}/${g.total}). Consider moving them to ${suggestedDay} instead.`
      };
    });

    res.status(200).json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Unable to compute suggestions' });
  }
};

module.exports = { scheduleTask, getWorkloadInsights, getSmartSuggestions };