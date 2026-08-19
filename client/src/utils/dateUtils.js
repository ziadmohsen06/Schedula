export const getDeadlineStatus = (deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`,
      color: 'error',
      isOverdue: true
    };
  } else if (diffDays === 0) {
    return {
      text: 'Due today',
      color: 'warning',
      isOverdue: false
    };
  } else if (diffDays === 1) {
    return {
      text: 'Due tomorrow',
      color: 'warning',
      isOverdue: false
    };
  } else if (diffDays <= 3) {
    return {
      text: `${diffDays} days left`,
      color: 'warning',
      isOverdue: false
    };
  } else if (diffDays <= 7) {
    return {
      text: `${diffDays} days left`,
      color: 'info',
      isOverdue: false
    };
  } else {
    return {
      text: `${diffDays} days left`,
      color: 'success',
      isOverdue: false
    };
  }
};

export const formatDeadline = (deadline) => {
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};