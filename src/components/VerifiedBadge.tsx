import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
}

export default function VerifiedBadge({ className = "" }: VerifiedBadgeProps) {
  return (
    <svg 
      className={`shrink-0 inline-block align-middle w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 ${className}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Verified Account"
    >
      <path 
        d="M12 2C12.55 2 13.07 2.22 13.46 2.61L14.41 3.56C14.8 3.95 15.32 4.17 15.87 4.17H17.22C18.32 4.17 19.22 5.07 19.22 6.17V7.52C19.22 8.07 19.44 8.59 19.83 8.98L20.78 9.93C21.56 10.71 21.56 11.98 20.78 12.76L19.83 13.71C19.44 14.1 19.22 14.62 19.22 15.17V16.52C19.22 17.62 18.32 18.52 17.22 18.52H15.87C15.32 18.52 14.8 18.74 14.41 19.13L13.46 20.08C12.68 20.86 11.41 20.86 10.63 20.08L9.68 19.13C9.29 18.74 8.77 18.52 8.22 18.52H6.87C5.77 18.52 4.87 17.62 4.87 16.52V15.17C4.87 14.62 4.65 14.1 4.26 13.71L3.31 12.76C2.53 11.98 2.53 10.71 3.31 9.93L4.26 8.98C4.65 8.59 4.87 8.07 4.87 7.52V6.17C4.87 5.07 5.77 4.17 6.87 4.17H8.22C8.77 4.17 9.29 3.95 9.68 3.56L10.63 2.61C11.02 2.22 11.54 2 12 2Z" 
        fill="#1877F2" 
      />
      <path 
        d="M10.29 14.25L7.5 11.46L8.56 10.4L10.29 12.13L15.44 6.98L16.5 8.04L10.29 14.25Z" 
        fill="white" 
      />
    </svg>
  );
}
