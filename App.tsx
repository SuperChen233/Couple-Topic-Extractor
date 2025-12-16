import React, { useState, useEffect, useCallback } from 'react';
import { Tab, Topic } from './types';
import { DEFAULT_SOURCE_URL, LOCAL_STORAGE_KEYS } from './constants';
import { fetchTopics, getNextRandomTopic, getTopicById } from './services/topicService';
import { taskManager } from './services/taskManager';
import { HeartButton } from './components/HeartButton';
import { DisplayBox } from './components/DisplayBox';
import { TabBar } from './components/TabBar';

// 底部导航栏的安全区域填充 (防止内容被遮挡)
const CONTENT_PADDING = "pb-32";

const App: React.FC = () => {
  // -- 状态定义 --
  
  // 当前选中的标签页 (默认为抽取页)
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.EXTRACT);
  // 所有加载的话题列表
  const [topics, setTopics] = useState<Topic[]>([]);
  // 已看过的话题 ID 列表 (用于去重)
  const [seenTopicIds, setSeenTopicIds] = useState<number[]>([]);
  // 点击次数 (用于控制背景颜色切换)
  const [clickCount, setClickCount] = useState<number>(0);
  // 当前使用的话题源 URL
  const [sourceUrl, setSourceUrl] = useState<string>(DEFAULT_SOURCE_URL);
  
  // -- UI 状态 --
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isAllSeen, setIsAllSeen] = useState<boolean>(false); // 是否已看完所有话题

  // -- 搜索页状态 --
  const [searchIndex, setSearchIndex] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Topic | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // -- 初始化逻辑 --
  useEffect(() => {
    // 1. 从 LocalStorage 读取持久化数据
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE_URL);
    const savedSeen = localStorage.getItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
    const savedClicks = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);

    // 2. 恢复状态
    if (savedUrl) setSourceUrl(savedUrl);
    if (savedSeen) setSeenTopicIds(JSON.parse(savedSeen));
    if (savedClicks) setClickCount(parseInt(savedClicks, 10));

    // 3. 初始加载话题数据
    loadTopics(savedUrl || DEFAULT_SOURCE_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 加载话题的核心函数
  const loadTopics = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTopics(url);
      if (data.length === 0) {
        setError("加载成功，但文件中没有找到文本行。");
      } else {
        setTopics(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // -- 功能 1: 话题抽取 --
  const handleExtractClick = useCallback(() => {
    // 边界检查：如果没有话题数据
    if (topics.length === 0) {
      if (!isLoading && !error) {
         setError("没有可用话题。请检查设置中的链接。");
      }
      return;
    }

    // 1. 调用任务管理器的预留接口
    taskManager.check_special_task();

    // 2. 增加点击计数 (逻辑：奇数显示绿色，偶数显示粉色)
    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLICK_COUNT, newCount.toString());

    // 3. 智能缓存与随机算法
    // 获取一个未看过的话题
    const nextTopic = getNextRandomTopic(topics, seenTopicIds);

    if (nextTopic) {
      setCurrentTopic(nextTopic);
      setIsAllSeen(false);
      
      // 更新已看列表并持久化存储
      const newSeen = [...seenTopicIds, nextTopic.id];
      setSeenTopicIds(newSeen);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS, JSON.stringify(newSeen));
    } else {
      // 如果所有话题都看过了
      setIsAllSeen(true);
      setCurrentTopic(null);
    }
  }, [clickCount, topics, seenTopicIds, isLoading, error]);

  // -- 功能 2: 序号检索 --
  const handleSearch = () => {
    const id = parseInt(searchIndex, 10);
    if (isNaN(id)) {
      setSearchError('请输入有效的数字');
      setSearchResult(null);
      return;
    }

    const found = getTopicById(topics, id);
    if (found) {
      setSearchResult(found);
      setSearchError(null);
    } else {
      setSearchResult(null);
      setSearchError('当前列表中未找到该话题。');
    }
  };

  // -- 功能 4: 设置相关 --
  
  // 保存新的 URL 并重置
  const handleUrlSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE_URL, sourceUrl);
    
    // 切换源时，通常意味着重新开始，所以重置所有状态
    setSeenTopicIds([]);
    setClickCount(0);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);
    
    loadTopics(sourceUrl);
    setCurrentTab(Tab.EXTRACT);
    alert("源地址已更新，状态已重置！");
  };

  // 仅清除历史缓存
  const handleClearCache = () => {
    if (window.confirm("确定要清除历史记录吗？清除后话题可能会重复出现。")) {
      // 1. 重置 React 状态
      setSeenTopicIds([]);
      setClickCount(0);
      setIsAllSeen(false);
      
      // 2. 清除 LocalStorage
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);

      // 3. 给出反馈
      alert("历史记录已成功清除！");
    }
  };

  // -- 背景颜色逻辑 --
  // 如果总点击数是奇数：清新绿。偶数：柔和粉。
  // 初始状态 (0) 是偶数 -> 粉色。
  const bgColorClass = clickCount % 2 !== 0 ? 'bg-freshGreen' : 'bg-pastelPink';

  // -- 渲染辅助函数: 抽取页 --
  const renderExtractTab = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in fade-in duration-500">
      <DisplayBox 
        topic={currentTopic} 
        isLoading={isLoading} 
        error={error}
        isAllSeen={isAllSeen}
      />
      <HeartButton onClick={handleExtractClick} disabled={isLoading || !!error} />
      <div className="text-darkGrey/50 text-sm font-medium">
        点击次数: {clickCount}
      </div>
    </div>
  );

  // -- 渲染辅助函数: 搜索页 --
  const renderIndexTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-darkGrey mb-6 text-center">话题搜索</h2>
      
      <div className="flex gap-2 mb-6">
        <input
          type="number"
          value={searchIndex}
          onChange={(e) => setSearchIndex(e.target.value)}
          placeholder="输入序号 #"
          className="flex-1 px-4 py-3 rounded-xl border-2 border-white bg-white/80 text-darkGrey placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
        />
        <button 
          onClick={handleSearch}
          className="bg-darkGrey text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          搜索
        </button>
      </div>

      <div className="min-h-[150px] flex items-center justify-center bg-white/40 rounded-xl p-4 border border-white/50">
        {searchError ? (
          <p className="text-red-500 font-medium">{searchError}</p>
        ) : searchResult ? (
          <div className="text-center">
             <span className="inline-block bg-cream text-darkGrey text-xs font-bold px-2 py-1 rounded-full mb-2">
                #{searchResult.id}
             </span>
             <p className="text-lg font-bold text-darkGrey">{searchResult.content}</p>
          </div>
        ) : (
          <p className="text-darkGrey/40 italic">结果将显示在这里</p>
        )}
      </div>
    </div>
  );

  // -- 渲染辅助函数: 设置页 --
  const renderSettingsTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-darkGrey mb-6 text-center">设置</h2>

      <div className="mb-6">
        <label className="block text-darkGrey font-bold mb-2 ml-1">话题源链接 (Raw Text)</label>
        <textarea
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full h-24 px-4 py-3 rounded-xl border-2 border-white bg-white/80 text-darkGrey text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all resize-none"
        />
        <p className="text-xs text-darkGrey/60 mt-2 ml-1">
          格式：每行 "序号. 内容" (支持自动编号)
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={handleUrlSave}
          className="w-full bg-darkGrey text-white py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg"
        >
          更新源并重置
        </button>

        <button 
          onClick={handleClearCache}
          className="w-full bg-white text-red-500 border-2 border-red-200 py-3 rounded-xl font-bold active:scale-95 transition-transform hover:bg-red-50"
        >
          仅清除历史记录
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-darkGrey/40">
        Couple Topic Extractor v1.1
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ease-in-out ${bgColorClass} flex flex-col font-sans overflow-hidden`}>
      {/* 头部标题区 */}
      <header className="pt-8 pb-4 px-6 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-md tracking-wide">
          情侣话题
        </h1>
      </header>

      {/* 主内容区 */}
      <main className={`flex-1 flex flex-col items-center justify-start pt-4 px-4 ${CONTENT_PADDING} overflow-y-auto`}>
        {currentTab === Tab.EXTRACT && renderExtractTab()}
        {currentTab === Tab.INDEX && renderIndexTab()}
        {currentTab === Tab.SETTINGS && renderSettingsTab()}
      </main>

      {/* 底部导航栏 */}
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;