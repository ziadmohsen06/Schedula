import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Paper,
  Stack, Chip, CircularProgress, Alert
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getCompletedTasks } from '../services/api';
import AppShell from '../components/AppShell';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';
import { THEME_REGISTRY } from '../theme';

// ─── Plant Visual ───────────────────────────────────────────────────────────
const PlantVisual = ({ streak, darkMode }) => {
  const level = Math.min(streak, 7);
  const stemHeight = 30 + level * 18;
  const leafSize = 12 + level * 6;
  const bloomColor = level >= 6 ? '#ff6f00' : level >= 4 ? '#F6C453' : level >= 2 ? '#69C37D' : '#a5d6a7';
  const potColor = darkMode ? '#5d4037' : '#8d6e63';
  const potRimColor = darkMode ? '#795548' : '#a1887f';
  const soilColor = darkMode ? '#3e2723' : '#6d4c41';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes bloom {
          0% { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .plant-sway { 
          transform-origin: bottom center;
          animation: sway 3s ease-in-out infinite;
        }
        .bloom-anim {
          animation: bloom 1s ease-out forwards;
        }
      `}</style>

      <svg width="160" height="220" viewBox="0 0 160 220">
        {/* Pot */}
        <polygon points="45,185 115,185 108,215 52,215" fill={potColor} />
        <rect x="38" y="173" width="84" height="14" rx="5" fill={potRimColor} />

        {/* Soil */}
        <ellipse cx="80" cy="174" rx="38" ry="7" fill={soilColor} />

        {/* Small rocks in soil */}
        <circle cx="65" cy="175" r="3" fill={darkMode ? '#4e342e' : '#8d6e63'} opacity="0.6" />
        <circle cx="90" cy="176" r="2" fill={darkMode ? '#4e342e' : '#8d6e63'} opacity="0.6" />

        {level === 0 ? (
          /* Wilted */
          <>
            <line x1="80" y1="173" x2="78" y2="145" stroke="#a5d6a7" strokeWidth="2" strokeLinecap="round" />
            <text x="62" y="138" fontSize="22">🥀</text>
          </>
        ) : (
          <g className="plant-sway">
            {/* Main stem */}
            <path
              d={`M 80 173 C 80 ${173 - stemHeight * 0.3} 80 ${173 - stemHeight * 0.7} 80 ${173 - stemHeight}`}
              stroke="#4caf50"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Side stem left */}
            {level >= 2 && (
              <path
                d={`M 80 ${173 - stemHeight * 0.5} C 70 ${173 - stemHeight * 0.55} 60 ${173 - stemHeight * 0.6} 50 ${173 - stemHeight * 0.5}`}
                stroke="#66bb6a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* Side stem right */}
            {level >= 3 && (
              <path
                d={`M 80 ${173 - stemHeight * 0.65} C 90 ${173 - stemHeight * 0.7} 100 ${173 - stemHeight * 0.75} 110 ${173 - stemHeight * 0.65}`}
                stroke="#66bb6a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* Leaf 1 — left */}
            {level >= 1 && (
              <ellipse
                cx={80 - leafSize * 0.9}
                cy={173 - stemHeight * 0.35}
                rx={leafSize}
                ry={leafSize * 0.45}
                fill="#66bb6a"
                transform={`rotate(-35, ${80 - leafSize * 0.9}, ${173 - stemHeight * 0.35})`}
              />
            )}

            {/* Leaf 2 — right */}
            {level >= 2 && (
              <ellipse
                cx={80 + leafSize * 0.9}
                cy={173 - stemHeight * 0.55}
                rx={leafSize}
                ry={leafSize * 0.45}
                fill="#4caf50"
                transform={`rotate(35, ${80 + leafSize * 0.9}, ${173 - stemHeight * 0.55})`}
              />
            )}

            {/* Leaf 3 — left branch leaf */}
            {level >= 2 && (
              <ellipse
                cx={50}
                cy={173 - stemHeight * 0.52}
                rx={leafSize * 0.8}
                ry={leafSize * 0.38}
                fill="#81c784"
                transform={`rotate(-20, 50, ${173 - stemHeight * 0.52})`}
              />
            )}

            {/* Leaf 4 — right branch leaf */}
            {level >= 3 && (
              <ellipse
                cx={110}
                cy={173 - stemHeight * 0.67}
                rx={leafSize * 0.8}
                ry={leafSize * 0.38}
                fill="#69C37D"
                transform={`rotate(20, 110, ${173 - stemHeight * 0.67})`}
              />
            )}

            {/* Leaf 5 — upper left */}
            {level >= 4 && (
              <ellipse
                cx={80 - leafSize}
                cy={173 - stemHeight * 0.78}
                rx={leafSize * 0.9}
                ry={leafSize * 0.4}
                fill="#43a047"
                transform={`rotate(-25, ${80 - leafSize}, ${173 - stemHeight * 0.78})`}
              />
            )}

            {/* Flower/bloom */}
            {level >= 1 && (
              <g className="bloom-anim">
                {/* Petals */}
                {level >= 4 && [0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const petalDist = level >= 6 ? 16 : 12;
                  const petalR = level >= 6 ? 9 : 7;
                  return (
                    <ellipse
                      key={i}
                      cx={80 + Math.cos(rad) * petalDist}
                      cy={173 - stemHeight + Math.sin(rad) * petalDist}
                      rx={petalR}
                      ry={petalR * 0.6}
                      fill={bloomColor}
                      opacity="0.85"
                      transform={`rotate(${angle}, ${80 + Math.cos(rad) * petalDist}, ${173 - stemHeight + Math.sin(rad) * petalDist})`}
                    />
                  );
                })}

                {/* Simple bud for early levels */}
                {level < 4 && (
                  <circle
                    cx="80"
                    cy={173 - stemHeight}
                    r={level >= 2 ? 10 : 7}
                    fill={bloomColor}
                    opacity="0.9"
                  />
                )}

                {/* Center */}
                <circle cx="80" cy={173 - stemHeight} r="6" fill="#fff9c4" />
                <circle cx="80" cy={173 - stemHeight} r="3" fill="#F6C453" />
              </g>
            )}

            {/* Sparkles for high streak */}
            {level >= 6 && (
              <>
                <text x="100" y={173 - stemHeight - 20} fontSize="12" opacity="0.7">✨</text>
                <text x="55" y={173 - stemHeight - 15} fontSize="10" opacity="0.6">⭐</text>
              </>
            )}
          </g>
        )}
      </svg>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {level === 0 ? '🥀 Start completing tasks to grow your plant!' :
          level <= 1 ? '🌱 A tiny sprout is emerging...' :
            level <= 2 ? '🌿 Your plant is sprouting nicely!' :
              level <= 3 ? '🍃 Growing steadily, keep going!' :
                level <= 4 ? '🌸 Your plant is budding!' :
                  level <= 5 ? '🌺 Beautiful blooms appearing!' :
                    level <= 6 ? '🌻 Your garden is thriving!' :
                      '🌳 A magnificent plant! You\'re unstoppable!'}
      </Typography>
    </Box>
  );
};

// ─── Emoji Plant (alternate plant types) ────────────────────────────────────
const PLANT_TYPES = {
  default: { label: 'Garden', emoji: '🌿' },
  cactus: { label: 'Cactus', emoji: '🌵' },
  sunflower: { label: 'Sunflower', emoji: '🌻' },
  cherry: { label: 'Cherry Blossom', emoji: '🌸' }
};

const EmojiPlantVisual = ({ streak, plantType }) => {
  const level = Math.min(streak, 7);
  const size = 48 + level * 14;
  const plant = PLANT_TYPES[plantType] || PLANT_TYPES.default;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
      <style>{`
        @keyframes emojiSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
      `}</style>
      <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {level >= 6 && <Typography sx={{ position: 'absolute', top: 10, left: '30%', fontSize: 16, opacity: 0.7 }}>✨</Typography>}
        {level >= 6 && <Typography sx={{ position: 'absolute', top: 20, right: '28%', fontSize: 12, opacity: 0.6 }}>⭐</Typography>}
        <Typography
          sx={{
            fontSize: level === 0 ? 40 : size,
            transformOrigin: 'bottom center',
            animation: level > 0 ? 'emojiSway 3s ease-in-out infinite' : 'none',
            filter: level === 0 ? 'grayscale(1) opacity(0.6)' : 'none'
          }}
        >
          {level === 0 ? '🥀' : plant.emoji}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {level === 0 ? '🥀 Start completing tasks to grow your plant!' :
          level <= 2 ? `🌱 Your ${plant.label.toLowerCase()} is sprouting!` :
            level <= 4 ? `🍃 Growing steadily, keep going!` :
              level <= 6 ? `🌺 Your ${plant.label.toLowerCase()} is thriving!` :
                `🌟 A magnificent ${plant.label.toLowerCase()}! You're unstoppable!`}
      </Typography>
    </Box>
  );
};

// ─── Theme-driven growth visual (ocean/space/minimal override the plant) ────
const ThemeGrowthVisual = ({ streak, content }) => {
  const level = Math.min(streak, 7);
  const emoji = content.growthStages[level] || content.growthStages[content.growthStages.length - 1];
  const size = 48 + level * 14;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
      <style>{`
        @keyframes emojiSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
      `}</style>
      <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {level >= 6 && content.ambientEmojis[0] && (
          <Typography sx={{ position: 'absolute', top: 10, left: '30%', fontSize: 16, opacity: 0.7 }}>{content.ambientEmojis[0]}</Typography>
        )}
        {level >= 6 && content.ambientEmojis[1] && (
          <Typography sx={{ position: 'absolute', top: 20, right: '28%', fontSize: 12, opacity: 0.6 }}>{content.ambientEmojis[1]}</Typography>
        )}
        <Typography
          sx={{
            fontSize: level === 0 ? 40 : size,
            transformOrigin: 'bottom center',
            animation: level > 0 ? 'emojiSway 3s ease-in-out infinite' : 'none',
          }}
        >
          {emoji}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        {level === 0 ? `Start completing tasks to grow ${content.plantSectionTitle.toLowerCase()}!` :
          level <= 2 ? `Just getting started!` :
            level <= 4 ? `Growing steadily, keep going!` :
              level <= 6 ? `Really thriving now!` :
                `Unstoppable! Incredible work.`}
      </Typography>
    </Box>
  );
};

// ─── Contribution Grid (GitHub-style with leaves) ──────────────────────────
const ContributionGrid = ({ tasks, darkMode, content, accentColor }) => {
  const weeks = 12;
  const days = 7;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build a map of date -> count
  const completionMap = {};
  tasks.forEach(task => {
    const date = new Date(task.updatedAt || task.createdAt).toDateString();
    completionMap[date] = (completionMap[date] || 0) + 1;
  });

  const today = new Date();
  const grid = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (days - 1 - d)));
      const count = completionMap[date.toDateString()] || 0;
      week.push({ date, count });
    }
    grid.push(week);
  }

  const emptyColor = darkMode ? alpha(accentColor, 0.12) : alpha(accentColor, 0.08);
  const getColor = (count) => {
    if (count === 0) return emptyColor;
    const opacity = Math.min(1, 0.35 + count * 0.22);
    return `${accentColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  const getEmoji = (count) => {
    if (count === 0) return null;
    const idx = Math.min(count, content.contributionEmojis.length - 1);
    return content.contributionEmojis[idx];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 0.4, overflowX: 'auto', pb: 1 }}>
        {/* Day labels */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mr: 0.5, justifyContent: 'space-around' }}>
          {dayLabels.map(d => (
            <Typography key={d} variant="caption" color="text.secondary" sx={{ fontSize: 9, lineHeight: '18px' }}>
              {d}
            </Typography>
          ))}
        </Box>

        {/* Grid */}
        {grid.map((week, wi) => (
          <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {week.map((cell, di) => (
              <Box
                key={di}
                title={`${cell.date.toDateString()}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: 0.8,
                  bgcolor: getColor(cell.count),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  cursor: 'default',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                  transition: 'transform 0.15s ease',
                  '&:hover': { transform: 'scale(1.4)', zIndex: 1 }
                }}
              >
                {cell.count > 0 && (
                  <span style={{ fontSize: 8, lineHeight: 1 }}>{getEmoji(cell.count)}</span>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Less</Typography>
        {[0, 1, 2, 3, 4].map(level => (
          <Box key={level} sx={{
            width: 14, height: 14, borderRadius: 0.5,
            bgcolor: getColor(level),
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`
          }} />
        ))}
        <Typography variant="caption" color="text.secondary">More</Typography>
      </Box>
    </Box>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const StreakPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [plantType, setPlantType] = useState(() => localStorage.getItem('plantType') || 'default');
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const accentColor = (THEME_REGISTRY[themeName] || THEME_REGISTRY.garden).swatch;

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChanged', sync);
    return () => window.removeEventListener('darkModeChanged', sync);
  }, []);

  const handleSelectPlant = (type) => {
    setPlantType(type);
    localStorage.setItem('plantType', type);
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await getCompletedTasks({ page: 1, limit: 100 });
        setTasks(data.tasks || []);
      } catch {
        setError('Failed to load streak data');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const totalCompleted = tasks.length;
  const currentStreak = Math.max(0, Math.min(7, Math.round(totalCompleted / 2)));
  const momentum = totalCompleted >= 5 ? 'Strong 🔥' : totalCompleted >= 2 ? `Building ${content.goodDayEmoji}` : `Starting ${content.growthStages[1]}`;

  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
    const active = index < Math.min(7, Math.max(0, Math.round(totalCompleted / 2)));
    return { dayLabel, active };
  });

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalFireDepartmentIcon sx={{ color: '#ff6f00' }} /> Streak
          </Typography>
          <Typography color="text.secondary">Keep completing tasks to grow {content.plantSectionTitle.toLowerCase()}! {content.goodDayEmoji}</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Stack spacing={3}>

            {/* Streak header card */}
            <Paper sx={{ p: 3, borderLeft: '4px solid #ff6f00', position: 'relative', overflow: 'hidden' }}>
              <Typography variant="subtitle2" color="text.secondary">Momentum</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalFireDepartmentIcon sx={{ color: '#ff6f00', fontSize: 40 }} />
                {currentStreak} day streak
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {user?.name || 'You'} completed {totalCompleted} task{totalCompleted === 1 ? '' : 's'} — {momentum}
              </Typography>
              <Typography sx={{ position: 'absolute', bottom: 8, right: 16, fontSize: 48, opacity: 0.08 }}>🔥</Typography>
            </Paper>

            {/* Plant + week grid side by side */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Paper sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>{content.logoEmoji} {content.plantSectionTitle}</Typography>
                {themeName !== 'garden' ? (
                  <ThemeGrowthVisual streak={currentStreak} content={content} />
                ) : plantType === 'default' ? (
                  <PlantVisual streak={currentStreak} darkMode={darkMode} />
                ) : (
                  <EmojiPlantVisual streak={currentStreak} plantType={plantType} />
                )}

                {themeName === 'garden' && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {Object.entries(PLANT_TYPES).map(([key, p]) => (
                      <Box
                        key={key}
                        onClick={() => handleSelectPlant(key)}
                        title={p.label}
                        sx={{
                          cursor: 'pointer', fontSize: 18, p: 0.5, borderRadius: 1,
                          border: '2px solid', borderColor: plantType === key ? 'primary.main' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        {p.emoji}
                      </Box>
                    ))}
                  </Box>
                )}

                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>{content.decorationsTitle}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {content.decorations.map((d) => {
                      const unlocked = totalCompleted >= d.threshold;
                      return (
                        <Box
                          key={d.label}
                          title={unlocked ? d.label : `Unlock at ${d.threshold} completed tasks (${d.threshold - totalCompleted} to go)`}
                          sx={{
                            fontSize: 22, opacity: unlocked ? 1 : 0.25,
                            filter: unlocked ? 'none' : 'grayscale(1)'
                          }}
                        >
                          {d.emoji}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ p: 3, flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>📅 This Week</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {recentDays.map((day) => (
                    <Box
                      key={day.dayLabel}
                      sx={{
                        flex: 1,
                        minWidth: 36,
                        p: 1,
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: day.active
                          ? (theme) => alpha(theme.palette.primary.main, 0.15)
                          : 'action.hover',
                        border: day.active ? '2px solid' : '1px solid',
                        borderColor: day.active ? 'primary.main' : 'divider',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {day.dayLabel}
                      </Typography>
                      <Typography sx={{ fontSize: 18, lineHeight: 1.4 }}>
                        {day.active ? content.weekActiveEmoji : '○'}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Milestone badges */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Milestones</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {content.milestoneChips.map(milestone => (
                      <Chip
                        key={milestone.count}
                        label={`${milestone.emoji} ${milestone.label}`}
                        size="small"
                        variant={totalCompleted >= milestone.count ? 'filled' : 'outlined'}
                        color={totalCompleted >= milestone.count ? 'success' : 'default'}
                        sx={{ opacity: totalCompleted >= milestone.count ? 1 : 0.4 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Stack>

            {/* Contribution grid */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{content.contributionTitle}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each mark represents tasks completed that day. Hover over a cell to see details.
              </Typography>
              <ContributionGrid tasks={tasks} darkMode={darkMode} content={content} accentColor={accentColor} />
            </Paper>

            {/* Recent wins */}
            <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>🏆 Recent Wins</Typography>
              {tasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3">{content.emptyStateEmoji}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Complete a task to start building your streak!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {tasks.slice(0, 8).map((task) => (
                    <Chip
                      key={task._id}
                      label={`✓ ${task.title}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
              )}
              <Typography sx={{ position: 'absolute', bottom: 6, right: 12, fontSize: 40, opacity: 0.07 }}>🏆</Typography>
            </Paper>

          </Stack>
        )}
      </Container>
    </AppShell>
  );
};

export default StreakPage;