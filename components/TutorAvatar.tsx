'use client';

import React from 'react';

export type TutorState = 'idle' | 'talking' | 'thinking' | 'happy';

interface TutorAvatarProps {
  state: TutorState;
  className?: string;
}

export const TutorAvatar: React.FC<TutorAvatarProps> = ({ state, className = '' }) => {
  const getStateClass = () => {
    switch (state) {
      case 'talking':
        return 'state-talking';
      case 'thinking':
        return 'state-thinking';
      case 'happy':
        return 'state-happy';
      case 'idle':
      default:
        return 'state-idle';
    }
  };

  return (
    <img
      src="/images/robot.png"
      alt="XPedition tutor robot"
      className={`robot-image object-contain transition-all duration-300 ${getStateClass()} ${className}`}
    />
  );
};


