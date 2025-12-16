import React from 'react';
import { Topic } from '../types';

interface DisplayBoxProps {
  topic: Topic | null;      // 当前要显示的话题
  isLoading: boolean;       // 加载状态
  error: string | null;     // 错误信息
  isAllSeen: boolean;       // 是否已看完所有话题
}

/**
 * DisplayBox 组件
 * 位于主页中央，用于展示话题内容、加载状态或错误提示。
 * 样式上采用了磨砂玻璃效果 (backdrop-blur)。
 */
export const DisplayBox: React.FC<DisplayBoxProps> = ({ topic, isLoading, error, isAllSeen }) => {
  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-lg border-4 border-white min-h-[200px] flex flex-col items-center justify-center text-center transition-all duration-500">
      {isLoading ? (
        // 加载中状态
        <div className="flex flex-col items-center animate-pulse-slow">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-darkGrey/70 font-medium">正在获取甜蜜话题...</p>
        </div>
      ) : error ? (
        // 错误状态
        <div className="text-red-500 font-bold">
          <p className="text-xl mb-2">哎呀！连接出错了</p>
          <p className="text-sm font-normal text-darkGrey">{error}</p>
        </div>
      ) : isAllSeen ? (
        // 全部看完状态
        <div className="text-darkGrey">
          <h3 className="text-2xl font-bold mb-2 text-pink-500">所有话题都聊完啦！</h3>
          <p>你们已经探索了所有内容！❤️</p>
          <p className="text-sm mt-4 text-gray-500">（在设置中清除历史记录以重新开始）</p>
        </div>
      ) : topic ? (
        // 正常显示话题
        <div className="animate-in fade-in zoom-in duration-300">
          <span className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
            话题 #{topic.id}
          </span>
          <p className="text-xl sm:text-2xl font-bold text-darkGrey leading-relaxed">
            {topic.content}
          </p>
        </div>
      ) : (
        // 初始空闲状态
        <div className="text-darkGrey/60 italic">
          点击爱心开始吧！
        </div>
      )}
    </div>
  );
};