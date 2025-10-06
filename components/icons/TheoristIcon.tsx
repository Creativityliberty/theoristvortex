
import React from 'react';

export const TheoristIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="m12 12 4 10" />
    <path d="M12 12 2 8" />
    <path d="m12 12-8 4" />
    <path d="M12 12a4.2 4.2 0 0 0 4.2-4.2" />
    <path d="M12 12a4.2 4.2 0 0 1-4.2-4.2" />
  </svg>
);
