import React from 'react';

interface HeartButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const HeartButton: React.FC<HeartButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group transform transition-all duration-300 active:scale-90
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
      aria-label="Get new topic"
    >
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        {/* Heart Shape using SVG */}
        <svg
          viewBox="0 0 32 29.6"
          className="w-full h-full drop-shadow-xl filter"
        >
          <path
            d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2
            c6.1-9.3,16-11.9,16-21.2C32,3.8,28.2,0,23.6,0z"
            fill="#FF6B6B"
            className="transition-colors duration-300 group-hover:fill-red-400"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg sm:text-xl pointer-events-none">
          Click Me!
        </span>
      </div>
    </button>
  );
};