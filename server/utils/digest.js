const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail, renderEmailShell } = require('./email');
const { getEmailTheme } = require('./emailTheme');

const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric'
});

const renderTaskItems = (tasks, overdue, dateField = 'deadline') => tasks.map(t =>
  `<li${overdue ? ' class="overdue"' : ''}>${escapeHtml(t.title)} — ${formatDate(t[dateField])}</li>`
).join('');

const buildDigestBody = (user, { overdue, dueThisWeek, completedLastWeek }) => {
  let body = `<p class="info-text">Hi <strong>${escapeHtml(user.name)}</strong>,</p>`;
  body += `<p class="info-text">Here's your weekly Schedula review:</p>`;

  body += `<p class="section-title">✅ Completed last 7 days (${completedLastWeek.length})</p>`;
  body += completedLastWeek.length
    ? `<ul class="task-list">${renderTaskItems(completedLastWeek, false, 'completedAt')}</ul>`
    : `<p class="info-text">Nothing completed yet this week.</p>`;

  if (overdue.length) {
    body += `<p class="section-title">⚠️ Overdue (${overdue.length})</p><ul class="task-list">${renderTaskItems(overdue, true)}</ul>`;
  }

  if (dueThisWeek.length) {
    body += `<p class="section-title">📅 Due this week (${dueThisWeek.length})</p><ul class="task-list">${renderTaskItems(dueThisWeek, false)}</ul>`;
  }

  if (!overdue.length && !dueThisWeek.length) {
    body += `<p class="info-text">🎉 Nothing overdue and nothing due this week. Enjoy the calm!</p>`;
  }

  body += `<p class="info-text">Keep tending your garden — every task you complete helps it grow.</p>`;
  return body;
};

const buildAccountabilityReportBody = (user, { overdue, dueThisWeek, completedLastWeek }) => {
  let body = `<p class="info-text"><strong>${escapeHtml(user.name)}</strong> asked Schedula to send you their weekly progress report:</p>`;

  body += `<p class="section-title">✅ Completed last 7 days (${completedLastWeek.length})</p>`;
  body += completedLastWeek.length
    ? `<ul class="task-list">${renderTaskItems(completedLastWeek, false, 'completedAt')}</ul>`
    : `<p class="info-text">Nothing completed this week.</p>`;

  if (overdue.length) {
    body += `<p class="section-title">⚠️ Overdue (${overdue.length})</p><ul class="task-list">${renderTaskItems(overdue, true)}</ul>`;
  }

  if (dueThisWeek.length) {
    body += `<p class="section-title">📅 Due this week (${dueThisWeek.length})</p><ul class="task-list">${renderTaskItems(dueThisWeek, false)}</ul>`;
  }

  body += `<p class="info-text">You're receiving this because ${escapeHtml(user.name)} added you as their accountability partner.</p>`;
  return body;
};

const sendAccountabilityReport = async (user, data) => {
  if (!user.accountabilityPartnerEmail) return;

  const themeName = user.themePreference?.name;
  const t = getEmailTheme(themeName);

  const html = renderEmailShell({
    subheading: `${user.name}'s Weekly Progress`,
    footerText: `${t.logoEmoji} Sent on their behalf by Schedula`,
    bodyHtml: buildAccountabilityReportBody(user, data),
    themeName
  });

  await sendEmail({
    to: user.accountabilityPartnerEmail,
    subject: `${user.name}'s Weekly Schedula Report`,
    html
  });
};

const sendWeeklyDigestToUser = async (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [overdue, dueThisWeek, completedLastWeek] = await Promise.all([
    Task.find({ user: user._id, status: { $ne: 'completed' }, deadline: { $lt: today } }).sort({ deadline: 1 }),
    Task.find({ user: user._id, status: { $ne: 'completed' }, deadline: { $gte: today, $lte: weekFromNow } }).sort({ deadline: 1 }),
    Task.find({ user: user._id, status: 'completed', completedAt: { $gte: weekAgo } }).sort({ completedAt: -1 })
  ]);

  const themeName = user.themePreference?.name;
  const t = getEmailTheme(themeName);

  const html = renderEmailShell({
    subheading: 'Your Weekly Digest',
    footerText: `${t.logoEmoji} See you next Sunday`,
    bodyHtml: buildDigestBody(user, { overdue, dueThisWeek, completedLastWeek }),
    themeName
  });

  await sendEmail({
    to: user.email,
    subject: 'Your Schedula Weekly Digest',
    html
  });

  await sendAccountabilityReport(user, { overdue, dueThisWeek, completedLastWeek });
};

const sendWeeklyDigests = async () => {
  const users = await User.find({});
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await sendWeeklyDigestToUser(user);
      sent++;
    } catch (err) {
      failed++;
      console.error(`Weekly digest failed for ${user.email}:`, err.message);
    }
  }

  console.log(`Weekly digest run complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};

module.exports = { sendWeeklyDigests, sendWeeklyDigestToUser };
