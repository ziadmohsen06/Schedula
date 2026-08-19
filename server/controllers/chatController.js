const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { CohereClient } = require('cohere-ai');
const Task = require('../models/Task');
const { logAuditEvent } = require('../utils/audit');

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

    console.log('Found tasks:', tasks.length, tasks.map(t => ({ title: t.title, status: t.status })));

    // Filter out completed tasks if status exists
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');

    console.log('Active tasks:', activeTasks.length);

    // DIRECT PARSING FIRST
    let parsedAction = parseSimpleCommand(message, activeTasks);
    console.log('Parsed action:', parsedAction);

    // If direct parsing failed, try AI
    if (!parsedAction || parsedAction.action === 'unknown') {
      try {
        if (process.env.COHERE_API_KEY) {
          const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
          const response = await cohere.chat({
            model: 'command-r7b-12-2024',
            message: `Parse this command: "${message}"
Tasks: ${JSON.stringify(activeTasks.map((t, i) => ({ index: i + 1, title: t.title, priority: t.priority })))}
Return JSON: {"action": "...", "taskIndex": number, "taskTitle": "...", "newPriority": "..."}`
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