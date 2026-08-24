const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { CohereClient } = require('cohere-ai');
const Task = require('../models/Task');
const { logAuditEvent } = require('../utils/audit');

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const VALID_TAGS = ['University', 'Work', 'Personal', 'Gym', 'Errands', 'Other'];

// YYYY-MM-DD in local time. Using toISOString() here would convert to UTC and
// silently shift the date by a day depending on the server's timezone offset.
const toLocalISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Finds a relative date phrase ("tomorrow", "thursday", "next friday", "in 3 days")
// and returns the resolved Date plus the matched text so it can be stripped from the title.
const parseRelativeDate = (message) => {
  const lower = message.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: d, matched: 'tomorrow' };
  }

  if (/\btoday\b/.test(lower)) {
    return { date: new Date(today), matched: 'today' };
  }

  const inDaysMatch = lower.match(/\bin (\d+) days?\b/);
  if (inDaysMatch) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inDaysMatch[1], 10));
    return { date: d, matched: inDaysMatch[0] };
  }

  const weekdayMatch = lower.match(/\b(next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekdayMatch) {
    const isNext = !!weekdayMatch[1];
    const targetDay = WEEKDAYS.indexOf(weekdayMatch[2]);
    let diff = (targetDay - today.getDay() + 7) % 7;
    if (diff === 0) {
      diff = isNext ? 7 : 0;
    } else if (isNext) {
      diff += 7;
    }
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return { date: d, matched: weekdayMatch[0] };
  }

  return null;
};

const parseChatCommand = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    // Fetch ALL tasks for this user (not just active)
    const tasks = await Task.find({
      user: req.user._id
    }).sort({ createdAt: 1 });

    // Filter out completed tasks if status exists
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');

    // DIRECT PARSING FIRST
    let parsedAction = parseSimpleCommand(message, activeTasks);

    // If direct parsing failed, try AI
    if (!parsedAction || parsedAction.action === 'unknown') {
      try {
        if (process.env.COHERE_API_KEY) {
          const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
          const today = new Date().toISOString().split('T')[0];
          const response = await cohere.chat({
            model: 'command-r7b-12-2024',
            message: `Today's date is ${today}. Parse this command: "${message}"
Existing tasks: ${JSON.stringify(activeTasks.map((t, i) => ({ index: i + 1, title: t.title, priority: t.priority })))}
Return ONLY JSON matching one of these shapes, no other text:
{"action":"change_priority","taskIndex":number,"newPriority":"low|medium|high|urgent"}
{"action":"delete_task","taskIndex":number}
{"action":"create_task","title":"...","deadline":"YYYY-MM-DD","tags":["University"|"Work"|"Personal"|"Gym"|"Errands"|"Other"],"newPriority":"low|medium|high|urgent"}
{"action":"unknown"}`
          });

          const text = response.text;
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            parsedAction = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (aiError) {
        console.warn('AI failed:', aiError.message);
      }
    }

    if (!parsedAction || parsedAction.action === 'unknown') {
      return res.json({
        success: true,
        result: { 
          message: `I found ${activeTasks.length} tasks. Try "show tasks" to see them, or use task numbers like "change task 1 to high".` 
        }
      });
    }

    let result;

    switch (parsedAction.action) {
      case 'change_priority':
        result = await changeTaskPriority(req.user._id, parsedAction, activeTasks);
        break;
      case 'delete_task':
        result = await deleteTask(req.user._id, parsedAction, activeTasks);
        break;
      case 'list_tasks':
        result = await listAllTasks(activeTasks);
        break;
      case 'list_overdue':
        result = await listOverdueTasks(activeTasks);
        break;
      case 'list_by_priority':
        result = await listTasksByPriority(parsedAction, activeTasks);
        break;
      case 'query_schedule':
        result = await querySchedule(req.user._id);
        break;
      case 'reschedule_all':
        result = await rescheduleAllTasks(req.user._id, parsedAction);
        break;
      case 'create_task':
        result = await createTaskFromChat(req.user._id, parsedAction);
        break;
      default:
        result = { message: 'Command not recognized. Try "show tasks" to see all tasks.' };
    }

    await logAuditEvent(req.user._id, 'chat command', req);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'Unable to process chat command' });
  }
};

// DIRECT PARSER
const parseSimpleCommand = (message, tasks) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Show all tasks
  if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('all task') || lowerMessage.includes('my task')) {
    if (lowerMessage.includes('overdue')) {
      return { action: 'list_overdue' };
    }
    if (lowerMessage.includes('high') || lowerMessage.includes('medium') || lowerMessage.includes('low') || lowerMessage.includes('urgent')) {
      const priorityMatch = lowerMessage.match(/(low|medium|high|urgent)/);
      if (priorityMatch) {
        return { action: 'list_by_priority', newPriority: priorityMatch[1] };
      }
    }
    return { action: 'list_tasks' };
  }
  
  // What's overdue
  if (lowerMessage.includes('overdue') || lowerMessage.includes('late')) {
    return { action: 'list_overdue' };
  }

  // Create task ("I have an exam Thursday", "add task submit report due Friday")
  // Anchored to the start of the message (after stripping polite prefixes) so it
  // doesn't collide with questions like "what do I have today?".
  const strippedMessage = lowerMessage.replace(/^(can you |please |could you )+/, '');
  const createTriggers = /^(i have|add (a )?task|new task|create task|remind me (to|about))\b/;
  if (createTriggers.test(strippedMessage)) {
    const dateInfo = parseRelativeDate(message);
    if (dateInfo) {
      let title = message
        .replace(/\b(can you|please)\b/gi, '')
        .replace(/\b(i have (an?)\s+|i have\s+|add (a )?task(:| to| for)?\s*|new task(:| to| for)?\s*|create task(:| to| for)?\s*|remind me (to|about)\s+)/gi, '')
        .replace(new RegExp(`\\b(due |on |by |this |next )?${dateInfo.matched}\\b`, 'i'), '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(an?|to|for)\s+/i, '')
        .trim();

      if (title) {
        title = title.charAt(0).toUpperCase() + title.slice(1);

        const isAcademic = /\b(exam|test|quiz|lecture|lesson|class|assignment|homework|study|university|school|midterm|final)\b/.test(lowerMessage);
        const isUrgent = /\b(exam|test|final|midterm|urgent)\b/.test(lowerMessage);

        return {
          action: 'create_task',
          title,
          deadline: toLocalISODate(dateInfo.date),
          tags: [isAcademic ? 'University' : 'Other'],
          newPriority: isUrgent ? 'high' : 'medium'
        };
      }
    }
  }

  // What do I have today/tomorrow
  if (lowerMessage.includes('today') || lowerMessage.includes('tomorrow') || lowerMessage.includes('this week')) {
    return { action: 'query_schedule' };
  }

  // Move everything to next week
  if (lowerMessage.includes('next week') || lowerMessage.includes('move everything') || lowerMessage.includes('push back')) {
    return {
      action: 'reschedule_all',
      newStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // Change priority
  if (lowerMessage.includes('priority') || (lowerMessage.includes('change') && lowerMessage.includes('to'))) {
    const priorityMatch = lowerMessage.match(/(low|medium|high|urgent)/);
    
    if (priorityMatch) {
      const newPriority = priorityMatch[1];
      
      // Try to find task number (supports: task 2, task #2, task number 2, #2)
      const taskNumberMatch = lowerMessage.match(/(?:task|#)\s*#?\s*(\d+)/);
      
      if (taskNumberMatch) {
        const taskIndex = parseInt(taskNumberMatch[1]) - 1;
        if (taskIndex >= 0 && taskIndex < tasks.length) {
          return {
            action: 'change_priority',
            taskIndex: taskIndex + 1,
            newPriority
          };
        }
      }
      
      // Try to find task by name
      let taskName = message;
      taskName = taskName.replace(/can you /i, '');
      taskName = taskName.replace(/please /i, '');
      taskName = taskName.replace(/change /i, '');
      taskName = taskName.replace(/the /i, '');
      taskName = taskName.replace(/task /i, '');
      taskName = taskName.replace(/priority /i, '');
      taskName = taskName.replace(/ to .*$/i, '');
      taskName = taskName.replace(/priority.*$/i, '');
      taskName = taskName.trim();
      
      const matchedTask = tasks.find(t => 
        t.title.toLowerCase().includes(taskName.toLowerCase()) ||
        taskName.toLowerCase().includes(t.title.toLowerCase())
      );
      
      if (matchedTask) {
        return {
          action: 'change_priority',
          taskTitle: matchedTask.title,
          newPriority
        };
      }
    }
  }
  
  // Delete task
  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    const taskNumberMatch = lowerMessage.match(/(?:task|#)\s*#?\s*(\d+)/);
    
    if (taskNumberMatch) {
      const taskIndex = parseInt(taskNumberMatch[1]) - 1;
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        return {
          action: 'delete_task',
          taskIndex: taskIndex + 1
        };
      }
    }
    
    let taskName = message;
    taskName = taskName.replace(/delete /i, '');
    taskName = taskName.replace(/remove /i, '');
    taskName = taskName.replace(/task /i, '');
    taskName = taskName.trim();
    
    const matchedTask = tasks.find(t => 
      t.title.toLowerCase().includes(taskName.toLowerCase()) ||
      taskName.toLowerCase().includes(t.title.toLowerCase())
    );
    
    if (matchedTask) {
      return {
        action: 'delete_task',
        taskTitle: matchedTask.title
      };
    }
  }
  
  return { action: 'unknown' };
};

// Helper functions
const findTask = (action, tasks) => {
  if (action.taskIndex) {
    const index = action.taskIndex - 1;
    if (index >= 0 && index < tasks.length) {
      return tasks[index];
    }
  }
  
  if (action.taskTitle) {
    return tasks.find(t => 
      t.title.toLowerCase().includes(action.taskTitle.toLowerCase()) ||
      action.taskTitle.toLowerCase().includes(t.title.toLowerCase())
    );
  }
  
  return null;
};

const listAllTasks = (tasks) => {
  if (tasks.length === 0) {
    return { message: '🎉 You have no tasks!' };
  }
  
  return {
    message: `📋 Your tasks:`,
    tasks: tasks.map((t, i) => ({
      number: i + 1,
      title: t.title,
      priority: t.priority,
      deadline: new Date(t.deadline).toLocaleDateString()
    }))
  };
};

const listOverdueTasks = (tasks) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdue = tasks.filter(t => new Date(t.deadline) < today);
  
  if (overdue.length === 0) {
    return { message: '✅ No overdue tasks!' };
  }
  
  return {
    message: `⚠️ ${overdue.length} overdue tasks:`,
    tasks: overdue.map((t, i) => ({
      number: i + 1,
      title: t.title,
      deadline: new Date(t.deadline).toLocaleDateString()
    }))
  };
};

const listTasksByPriority = (action, tasks) => {
  const filtered = tasks.filter(t => t.priority === action.newPriority);
  
  if (filtered.length === 0) {
    return { message: `✅ No ${action.newPriority} priority tasks.` };
  }
  
  return {
    message: `📋 ${action.newPriority} priority tasks:`,
    tasks: filtered.map((t, i) => ({
      number: i + 1,
      title: t.title,
      deadline: new Date(t.deadline).toLocaleDateString()
    }))
  };
};

const changeTaskPriority = async (userId, action, tasks) => {
  const task = findTask(action, tasks);
  
  if (!task) {
    return { 
      message: `❌ Could not find that task. Your tasks:\n${tasks.map((t, i) => `#${i + 1}: ${t.title}`).join('\n')}` 
    };
  }
  
  task.priority = action.newPriority;
  task.scheduledDays = [];
  await task.save();
  
  return {
    message: `✅ Changed priority of "${task.title}" to ${action.newPriority}`
  };
};

const deleteTask = async (userId, action, tasks) => {
  const task = findTask(action, tasks);
  
  if (!task) {
    return { 
      message: `❌ Could not find that task. Your tasks:\n${tasks.map((t, i) => `#${i + 1}: ${t.title}`).join('\n')}` 
    };
  }
  
  await Task.findByIdAndDelete(task._id);
  
  return {
    message: `✅ Deleted task: "${task.title}"`
  };
};

const querySchedule = async (userId) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await Task.find({
    user: userId,
    deadline: { $gte: today, $lte: tomorrow }
  });

  if (tasks.length === 0) {
    return { message: '🎉 No tasks due today or tomorrow!' };
  }

  return {
    message: `📅 ${tasks.length} tasks in next 2 days:`,
    tasks: tasks.map((t, i) => ({
      number: i + 1,
      title: t.title,
      deadline: new Date(t.deadline).toLocaleDateString(),
      priority: t.priority
    }))
  };
};

const createTaskFromChat = async (userId, action) => {
  if (!action.title || !action.deadline || isNaN(new Date(action.deadline).getTime())) {
    return {
      message: '❌ I couldn\'t figure out the task title or date. Try something like "I have an exam Thursday" or "add task submit report due Friday".'
    };
  }

  const tags = Array.isArray(action.tags)
    ? action.tags.filter(t => VALID_TAGS.includes(t))
    : [];

  const task = await Task.create({
    user: userId,
    title: action.title,
    deadline: new Date(action.deadline),
    priority: ['low', 'medium', 'high', 'urgent'].includes(action.newPriority) ? action.newPriority : 'medium',
    tags: tags.length ? tags : ['Other']
  });

  return {
    message: `✅ Added task "${task.title}" due ${new Date(task.deadline).toLocaleDateString()}`
  };
};

const rescheduleAllTasks = async (userId, action) => {
  const tasks = await Task.find({ user: userId });
  const startDate = action.newStartDate ? new Date(action.newStartDate) : new Date();

  for (let i = 0; i < tasks.length; i++) {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + i);
    tasks[i].deadline = newDate;
    tasks[i].scheduledDays = [];
    await tasks[i].save();
  }

  return {
    message: `✅ Rescheduled ${tasks.length} tasks starting from ${startDate.toLocaleDateString()}`
  };
};

module.exports = { parseChatCommand };