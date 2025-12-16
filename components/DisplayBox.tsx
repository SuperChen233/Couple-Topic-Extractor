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
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-lg border-4 border-white min-h-[200px] flex flex-col items-center justify-center text-center transition-all duration-500">
      {isLoading ? (
        <div className="flex flex-col items-center animate-pulse-slow">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-darkGrey/70 font-medium">Fetching love topics...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 font-bold">
          <p className="text-xl mb-2">Oh no! Connection Error</p>
          <p className="text-sm font-normal text-darkGrey">{error}</p>
        </div>
      ) : isAllSeen ? (
        <div className="text-darkGrey">
          <h3 className="text-2xl font-bold mb-2 text-pink-500">All topics completed!</h3>
          <p>You've explored everything together! ❤️</p>
          <p className="text-sm mt-4 text-gray-500">(Clear cache in Settings to restart)</p>
        </div>
      ) : topic ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <span className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
            Topic #{topic.id}
          </span>
          <p className="text-xl sm:text-2xl font-bold text-darkGrey leading-relaxed">
            {topic.content}
          </p>
        </div>
      ) : (
        <div className="text-darkGrey/60 italic">
          Tap the heart to start!
        </div>
      )}
    </div>
  );
};