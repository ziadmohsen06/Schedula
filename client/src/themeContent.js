// Non-color theme content: every garden-specific word/emoji/visual lives here,
// keyed the same way as theme.js's THEME_REGISTRY, so switching themes changes
// more than just the palette.
export const THEME_CONTENT = {
  garden: {
    name: 'Garden',
    logoEmoji: '🌿',
    tagline: 'Your Productivity Garden',
    description: 'Your productivity garden — plan tasks, let AI schedule your week, and watch your progress grow.',
    footerTagline: '🌱 Grow every day.',
    growSubtitle: 'Today feels like a great day to grow 🌿',
    goodDayEmoji: '🍃',
    tasksEmoji: '🌿',
    progressCardEmoji: '🌱',
    emptyStateEmoji: '🌱',
    emptyStateTitle: 'Your garden is ready.',
    emptyStateSubtitle: 'Plant your first task to start growing.',
    emptyStateCta: '+ Plant a Task',
    weekActiveEmoji: '🍃',
    milestoneChips: [
      { count: 1, label: '1st task', emoji: '🌱' },
      { count: 5, label: '5 tasks', emoji: '🌿' },
      { count: 10, label: '10 tasks', emoji: '🍃' },
      { count: 20, label: '20 tasks', emoji: '🌳' }
    ],
    ambientEmojis: ['🍃', '🌿', '🍀'],
    centerpieceEmoji: '🪴',
    growthStages: ['🥀', '🌱', '🌱', '🌿', '🌿', '🌸', '🌺', '🌳'],
    contributionEmojis: [null, '🌱', '🌿', '🍃'],
    plantSectionTitle: 'Your Plant',
    contributionTitle: '🌿 Contribution Garden',
    decorationsTitle: 'Garden Decorations',
    decorations: [
      { threshold: 5, emoji: '🦋', label: 'Butterfly' },
      { threshold: 15, emoji: '🐝', label: 'Bee' },
      { threshold: 30, emoji: '🪣', label: 'Watering Can' },
      { threshold: 50, emoji: '🌈', label: 'Rainbow' }
    ],
    tipTitle: 'Garden Tip',
    tipText: 'Complete tasks daily to keep your plant growing. Consistency is the key to a thriving garden!',
    tipEmoji: '🌻',
    milestoneMessages: [
      "You're on fire! 🔥 Keep that momentum going.",
      "Look at you go! 🚀 Your garden is thriving.",
      "Consistency like this is how habits are built. 💪",
      "Incredible progress — your future self says thanks. 🌿",
      "Every task completed is a leaf on your tree. 🌳 Beautiful work."
    ]
  },
  ocean: {
    name: 'Ocean',
    logoEmoji: '🐠',
    tagline: 'Your Productivity Reef',
    description: 'Your productivity reef — plan tasks, let AI schedule your week, and watch your reef flourish.',
    footerTagline: '🐬 Dive deeper every day.',
    growSubtitle: 'Today feels like a great day to dive 🐠',
    goodDayEmoji: '🫧',
    tasksEmoji: '🐠',
    progressCardEmoji: '🐚',
    emptyStateEmoji: '🐚',
    emptyStateTitle: 'Your reef is ready.',
    emptyStateSubtitle: 'Add your first task to start growing your reef.',
    emptyStateCta: '+ Add a Task',
    weekActiveEmoji: '🫧',
    milestoneChips: [
      { count: 1, label: '1st task', emoji: '🐚' },
      { count: 5, label: '5 tasks', emoji: '🐟' },
      { count: 10, label: '10 tasks', emoji: '🐠' },
      { count: 20, label: '20 tasks', emoji: '🐋' }
    ],
    ambientEmojis: ['🐟', '🐠', '🫧'],
    centerpieceEmoji: '🪸',
    growthStages: ['🦴', '🐚', '🐚', '🪸', '🪸', '🐡', '🐙', '🐋'],
    contributionEmojis: [null, '🐚', '🐟', '🫧'],
    plantSectionTitle: 'Your Coral',
    contributionTitle: '🐠 Contribution Reef',
    decorationsTitle: 'Reef Treasures',
    decorations: [
      { threshold: 5, emoji: '🐢', label: 'Turtle' },
      { threshold: 15, emoji: '🦀', label: 'Crab' },
      { threshold: 30, emoji: '⚓', label: 'Anchor' },
      { threshold: 50, emoji: '🌊', label: 'Wave' }
    ],
    tipTitle: 'Reef Tip',
    tipText: 'Complete tasks daily to keep your reef growing. Consistency keeps the current flowing!',
    tipEmoji: '🐬',
    milestoneMessages: [
      "You're making waves! 🌊 Keep that momentum going.",
      "Look at you go! 🐬 Your reef is thriving.",
      "Consistency like this is how habits are built. 💪",
      "Incredible progress — your future self says thanks. 🐠",
      "Every task completed adds another coral branch. 🪸 Beautiful work."
    ]
  },
  space: {
    name: 'Space',
    logoEmoji: '🚀',
    tagline: 'Your Productivity Galaxy',
    description: 'Your productivity galaxy — plan tasks, let AI schedule your week, and watch your mission progress.',
    footerTagline: '🌠 Explore further every day.',
    growSubtitle: 'Today feels like a great day to launch 🚀',
    goodDayEmoji: '✨',
    tasksEmoji: '🚀',
    progressCardEmoji: '⭐',
    emptyStateEmoji: '🌑',
    emptyStateTitle: 'Your mission awaits.',
    emptyStateSubtitle: 'Add your first task to begin the countdown.',
    emptyStateCta: '+ Launch a Task',
    weekActiveEmoji: '✨',
    milestoneChips: [
      { count: 1, label: '1st task', emoji: '🌑' },
      { count: 5, label: '5 tasks', emoji: '⭐' },
      { count: 10, label: '10 tasks', emoji: '🪐' },
      { count: 20, label: '20 tasks', emoji: '🌌' }
    ],
    ambientEmojis: ['⭐', '✨', '🪐'],
    centerpieceEmoji: '🛰️',
    growthStages: ['💫', '🌑', '🌒', '🌓', '🌔', '🌕', '🪐', '🌌'],
    contributionEmojis: [null, '⭐', '✨', '🪐'],
    plantSectionTitle: 'Your Orbit',
    contributionTitle: '🚀 Mission Log',
    decorationsTitle: 'Mission Badges',
    decorations: [
      { threshold: 5, emoji: '👽', label: 'Alien' },
      { threshold: 15, emoji: '☄️', label: 'Comet' },
      { threshold: 30, emoji: '🛸', label: 'UFO' },
      { threshold: 50, emoji: '🌌', label: 'Galaxy' }
    ],
    tipTitle: 'Mission Tip',
    tipText: 'Complete tasks daily to keep your mission on course. Consistency is what gets you to orbit!',
    tipEmoji: '🌠',
    milestoneMessages: [
      "You're on a trajectory! 🚀 Keep that momentum going.",
      "Look at you go! 🌌 Your mission is thriving.",
      "Consistency like this is how habits are built. 💪",
      "Incredible progress — your future self says thanks. ⭐",
      "Every task completed is another star charted. 🪐 Beautiful work."
    ]
  },
  minimal: {
    name: 'Minimal',
    logoEmoji: '◆',
    tagline: 'Stay Focused',
    description: 'A focused productivity space — plan tasks, let AI schedule your week, and track your progress.',
    footerTagline: '● Improve every day.',
    growSubtitle: 'A clean day to make progress.',
    goodDayEmoji: '○',
    tasksEmoji: '◆',
    progressCardEmoji: '○',
    emptyStateEmoji: '○',
    emptyStateTitle: 'Nothing on your list.',
    emptyStateSubtitle: 'Add your first task to get started.',
    emptyStateCta: '+ Add a Task',
    weekActiveEmoji: '●',
    milestoneChips: [
      { count: 1, label: '1st task', emoji: '○' },
      { count: 5, label: '5 tasks', emoji: '◔' },
      { count: 10, label: '10 tasks', emoji: '◑' },
      { count: 20, label: '20 tasks', emoji: '●' }
    ],
    ambientEmojis: [],
    centerpieceEmoji: '',
    growthStages: ['○', '○', '◔', '◑', '◑', '◕', '●', '●'],
    contributionEmojis: [null, '○', '◑', '●'],
    plantSectionTitle: 'Your Progress',
    contributionTitle: '◆ Contribution Log',
    decorationsTitle: 'Achievements',
    decorations: [
      { threshold: 5, emoji: '✦', label: 'Focus' },
      { threshold: 15, emoji: '◆', label: 'Discipline' },
      { threshold: 30, emoji: '▲', label: 'Momentum' },
      { threshold: 50, emoji: '●', label: 'Mastery' }
    ],
    tipTitle: 'Tip',
    tipText: 'Complete tasks daily to build momentum. Small, consistent steps compound.',
    tipEmoji: '✦',
    milestoneMessages: [
      "Strong progress. Keep going.",
      "Consistency compounds. Nice work.",
      "That's real momentum.",
      "Small steps, real results.",
      "Focused and moving forward."
    ]
  }
};

export const getThemeContent = (themeName) => THEME_CONTENT[themeName] || THEME_CONTENT.garden;
