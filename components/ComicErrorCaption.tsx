'use client';

import React from 'react';

interface ComicErrorCaptionProps {
  message: string;
  className?: string;
}

export const ComicErrorCaption: React.FC<ComicErrorCaptionProps> = ({
  message,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div className={`comic-error-caption ${className}`} role="alert">
      {message}
    </div>
  );
};
