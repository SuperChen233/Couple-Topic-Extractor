import React from 'react';
import { Tab } from '../types';

interface TabBarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

/**
 * TabBar 组件
 * 底部导航栏，用于在抽取、检索和设置页面之间切换。
 * 选中状态会有上浮和阴影效果。
 */
export const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: Tab.EXTRACT, label: '抽取', icon: '✨' },
    { id: Tab.INDEX, label: '检索', icon: '🔍' },
    { id: Tab.SETTINGS, label: '设置', icon: '⚙️' },
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