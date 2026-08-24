import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const ITEM_COUNT = 5;

// One big anchored centerpiece plus a handful of large items swaying gently in
// place, like a breeze — behind all page content. Fully theme-driven: garden
// gets a potted plant + leaves, ocean gets fish + bubbles, space gets stars +
// planets, minimal renders nothing at all.
const AmbientLeaves = () => {
  const themeName = useThemeName();
  const content = getThemeContent(themeName);

  const items = useMemo(() => {
    if (!content.ambientEmojis.length) return [];
    return Array.from({ length: ITEM_COUNT }, (_, i) => ({
      id: i,
      emoji: content.ambientEmojis[Math.floor(Math.random() * content.ambientEmojis.length)],
      top: 8 + Math.random() * 78,
      left: Math.random() * 92,
      size: 52 + Math.random() * 56,
      duration: 5 + Math.random() * 4,
      delay: -(Math.random() * 8),
      swayAngle: 6 + Math.random() * 8,
      swayX: 8 + Math.random() * 14,
      opacity: 0.12 + Math.random() * 0.14
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeName]);

  if (!content.ambientEmojis.length) return null;

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1
      }}
    >
      <style>
        {`@keyframes leafSway {
          0%, 100% { transform: rotate(calc(-1 * var(--sway-angle))) translateX(calc(-1 * var(--sway-x))); }
          50% { transform: rotate(var(--sway-angle)) translateX(var(--sway-x)); }
        }
        @keyframes plantSway {
          0%, 100% { transform: rotate(-2.5deg); }
          50% { transform: rotate(2.5deg); }
        }`}
      </style>

      {content.centerpieceEmoji && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -20,
            fontSize: { xs: 160, md: 240 },
            opacity: 0.15,
            transformOrigin: 'bottom center',
            animation: 'plantSway 8s ease-in-out infinite'
          }}
        >
          {content.centerpieceEmoji}
        </Box>
      )}

      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            position: 'absolute',
            top: `${item.top}%`,
            left: `${item.left}%`,
            fontSize: `${item.size}px`,
            opacity: item.opacity,
            transformOrigin: 'top center',
            '--sway-angle': `${item.swayAngle}deg`,
            '--sway-x': `${item.swayX}px`,
            animation: `leafSway ${item.duration}s ease-in-out ${item.delay}s infinite`
          }}
        >
          {item.emoji}
        </Box>
      ))}
    </Box>
  );
};

export default AmbientLeaves;
