import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

const FloatingLeaves = ({ trigger, count = 10 }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (trigger > 0) {
      const leafEmojis = ['🍃', '🌿', '🍀', '☘️', '🌱'];
      const newLeaves = [];
      
      for (let i = 0; i < count; i++) {
        newLeaves.push({
          id: `${Date.now()}-${i}`,
          emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
          left: 35 + Math.random() * 30, // 35-65% of screen width
          size: 16 + Math.random() * 24, // 16-40px
          duration: 1.5 + Math.random() * 1.5, // 1.5-3s
          delay: Math.random() * 0.5, // 0-0.5s delay
          driftX: (Math.random() - 0.5) * 100, // Random horizontal drift
          rotation: Math.random() * 360,
        });
      }
      
      setLeaves(newLeaves);
      
      const timer = setTimeout(() => {
        setLeaves([]);
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, count]);

  if (leaves.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Define the keyframes once */}
      <style>
        {`@keyframes floatLeafUp {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-60px) translateX(var(--drift-x)) rotate(90deg) scale(1.1);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-120px) translateX(calc(var(--drift-x) * 1.5)) rotate(180deg) scale(1.2);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-180px) translateX(calc(var(--drift-x) * 2)) rotate(270deg) scale(1);
            opacity: 0.5;
          }
          100% {
            transform: translateY(-240px) translateX(calc(var(--drift-x) * 2.5)) rotate(360deg) scale(0.7);
            opacity: 0;
          }
        }`}
      </style>
      
      {leaves.map((leaf) => (
        <Box
          key={leaf.id}
          sx={{
            position: 'absolute',
            top: '50%',
            left: `${leaf.left}%`,
            fontSize: `${leaf.size}px`,
            '--drift-x': `${leaf.driftX}px`,
            animation: `floatLeafUp ${leaf.duration}s ease-out ${leaf.delay}s forwards`,
            opacity: 0,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        >
          {leaf.emoji}
        </Box>
      ))}
    </Box>
  );
};

export default FloatingLeaves;