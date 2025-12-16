import React from 'react';

interface HeartButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * HeartButton 组件
 * 一个巨大的爱心形状按钮，用于触发话题抽取。
 * 包含 SVG 绘制的爱心和点击时的缩放动画。
 */
export const HeartButton: React.FC<HeartButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group transform transition-all duration-300 active:scale-90
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
      `}
      aria-label="获取新话题"
    >
      <div className="relative w-24 h-24 sm:w-32 sm:h-32">
        {/* 使用 SVG 绘制爱心形状 */}
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
          点我!
        </span>
      </div>
    </button>
  );
};