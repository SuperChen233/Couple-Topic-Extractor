
import React from 'react';
import { Topic } from '../types';

interface DisplayBoxProps {
  topic: Topic | null;
  isLoading: boolean;
  error: string | null;
  isAllSeen: boolean;
}

export const DisplayBox: React.FC<DisplayBoxProps> = ({ topic, isLoading, error, isAllSeen }) => {
  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-xl border-4 border-white min-h-[240px] flex flex-col items-center justify-center text-center transition-all duration-500 relative overflow-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center animate-pulse-slow">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-darkGrey/70 font-medium">正在获取甜蜜话题...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 font-bold p-4">
          <p className="text-xl mb-2">哎呀！连接出错了</p>
          <p className="text-sm font-normal text-darkGrey">{error}</p>
        </div>
      ) : isAllSeen ? (
        <div className="text-darkGrey animate-in fade-in zoom-in">
          <h3 className="text-2xl font-bold mb-2 text-pink-500">所有话题都聊完啦！</h3>
          <p>你们已经探索了所有内容！❤️</p>
          <p className="text-xs mt-6 text-gray-400 italic">（在设置中清除历史记录以重新开始）</p>
        </div>
      ) : topic ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 w-full flex flex-col items-center">
          {/* 分类小显示框 */}
          <div className="mb-4 flex flex-col items-center gap-2">
            <span className="inline-block bg-white/50 border border-pink-200 text-pink-500 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full shadow-sm">
              {topic.category || '默认分类'}
            </span>
            <span className="text-[10px] font-bold text-gray-300">
              话题 #{topic.id}
            </span>
          </div>
          
          <p className="text-xl sm:text-2xl font-bold text-darkGrey leading-relaxed px-2">
            {topic.content}
          </p>
          
          {/* 装饰性小圆点 */}
          <div className="mt-8 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-pink-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-pink-200"></div>
          </div>
        </div>
      ) : (
        <div className="text-darkGrey/40 flex flex-col items-center">
          <span className="text-4xl mb-4 opacity-50">💌</span>
          <p className="italic font-medium">准备好开始一段深入的对话了吗？</p>
          <p className="text-xs mt-2">点击下方的爱心按钮</p>
        </div>
      )}
    </div>
  );
};
