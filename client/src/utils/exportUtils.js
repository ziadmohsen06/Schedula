// Export tasks to CSV
export const exportToCSV = (tasks) => {
  const headers = ['Title', 'Priority', 'Deadline', 'Estimated Hours', 'Status', 'Tags'];
  
  const rows = tasks.map(task => [
    task.title,
    task.priority,
    new Date(task.deadline).toLocaleDateString(),
    task.estimatedHours,
    task.status,
    (task.tags || []).join('; ')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `schedula_tasks_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export tasks to JSON
export const exportToJSON = (tasks) => {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `schedula_tasks_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export tasks to text file
export const exportToPDF = (tasks) => {
  const content = tasks.map(task => `
Title: ${task.title}
Priority: ${task.priority}
Deadline: ${new Date(task.deadline).toLocaleDateString()}
Estimated Hours: ${task.estimatedHours}
Status: ${task.status}
Tags: ${(task.tags || []).join(', ')}
Description: ${task.description || 'N/A'}
${task.scheduledDays && task.scheduledDays.length > 0 ? 'Schedule:\n' + task.scheduledDays.map(d => `  ${new Date(d.date).toLocaleDateString()} - ${d.hoursPerDay}hrs - ${d.focus || ''}`).join('\n') : ''}
---`).join('\n');
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `schedula_tasks_${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};