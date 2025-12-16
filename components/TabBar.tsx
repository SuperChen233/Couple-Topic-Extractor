import React from 'react';
import { Tab } from '../types';

interface TabBarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: Tab.EXTRACT, label: 'Extract', icon: '✨' },
    { id: Tab.INDEX, label: 'Index', icon: '🔍' },
    { id: Tab.SETTINGS, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-cream shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-[2rem] px-6 py-4 flex justify-around items-center z-50 safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200
              ${isActive ? 'bg-white shadow-sm scale-110 -translate-y-2' : 'hover:bg-white/50'}
            `}
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            <span className={`text-xs font-bold ${isActive ? 'text-darkGrey' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};