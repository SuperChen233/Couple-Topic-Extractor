
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tab, Topic } from './types';
import { DEFAULT_SOURCE_URL, LOCAL_STORAGE_KEYS } from './constants';
import { fetchTopics, getNextRandomTopic, getTopicById } from './services/topicService';
import { taskManager } from './services/taskManager';
import { HeartButton } from './components/HeartButton';
import { DisplayBox } from './components/DisplayBox';
import { TabBar } from './components/TabBar';

const CONTENT_PADDING = "pb-32";

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.EXTRACT);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [seenTopicIds, setSeenTopicIds] = useState<number[]>([]);
  const [clickCount, setClickCount] = useState<number>(0);
  const [sourceUrl, setSourceUrl] = useState<string>(DEFAULT_SOURCE_URL);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [fetchSource, setFetchSource] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isAllSeen, setIsAllSeen] = useState<boolean>(false);

  const [searchIndex, setSearchIndex] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Topic | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 计算所有唯一的分类
  const allCategories = useMemo(() => {
    return Array.from(new Set(topics.map(t => t.category || '默认话题')));
  }, [topics]);

  // 根据禁用的分类过滤出当前可用的所有话题
  const filteredTopics = useMemo(() => {
    return topics.filter(t => !disabledCategories.includes(t.category || '默认话题'));
  }, [topics, disabledCategories]);

  const loadTopics = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { topics: data, isOffline, source } = await fetchTopics(url);
      setTopics(data);
      setIsOfflineMode(isOffline);
      setFetchSource(source);
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接异常');
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE_URL);
    const savedSeen = localStorage.getItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
    const savedClicks = localStorage.getItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);
    const savedDisabled = localStorage.getItem(LOCAL_STORAGE_KEYS.DISABLED_CATEGORIES);

    if (savedUrl) setSourceUrl(savedUrl);
    if (savedSeen) {
      try {
        setSeenTopicIds(JSON.parse(savedSeen));
      } catch (e) {
        setSeenTopicIds([]);
      }
    }
    if (savedClicks) setClickCount(parseInt(savedClicks, 10));
    if (savedDisabled) {
      try {
        setDisabledCategories(JSON.parse(savedDisabled));
      } catch (e) {
        setDisabledCategories([]);
      }
    }

    loadTopics(savedUrl || DEFAULT_SOURCE_URL);
  }, []);

  const handleExtractClick = useCallback(() => {
    if (filteredTopics.length === 0) {
      if (topics.length > 0) {
        setError("当前分类已全部屏蔽");
      } else if (!isLoading) {
        loadTopics(sourceUrl);
      }
      return;
    }

    setError(null);
    taskManager.check_special_task();

    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLICK_COUNT, newCount.toString());

    const nextTopic = getNextRandomTopic(filteredTopics, seenTopicIds);

    if (nextTopic) {
      setCurrentTopic(nextTopic);
      setIsAllSeen(false);
      const newSeen = [...seenTopicIds, nextTopic.id];
      setSeenTopicIds(newSeen);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS, JSON.stringify(newSeen));
    } else {
      setIsAllSeen(true);
      setCurrentTopic(null);
    }
  }, [clickCount, filteredTopics, topics.length, seenTopicIds, isLoading, sourceUrl]);

  const handleSearch = () => {
    const id = parseInt(searchIndex, 10);
    if (isNaN(id)) {
      setSearchError('请输入数字序号');
      setSearchResult(null);
      return;
    }
    const found = getTopicById(topics, id);
    if (found) {
      setSearchResult(found);
      setSearchError(null);
    } else {
      setSearchResult(null);
      setSearchError('未找到该话题');
    }
  };

  const handleUrlSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE_URL, sourceUrl);
    setSeenTopicIds([]);
    setClickCount(0);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);
    loadTopics(sourceUrl);
    setCurrentTab(Tab.EXTRACT);
  };

  const toggleCategory = (category: string) => {
    const newDisabled = disabledCategories.includes(category)
      ? disabledCategories.filter(c => c !== category)
      : [...disabledCategories, category];
    
    setDisabledCategories(newDisabled);
    localStorage.setItem(LOCAL_STORAGE_KEYS.DISABLED_CATEGORIES, JSON.stringify(newDisabled));
    // 切换分类筛选后，重置当前展示话题状态，避免显示了已禁用的分类
    if (currentTopic && newDisabled.includes(currentTopic.category || '默认话题')) {
      setCurrentTopic(null);
    }
  };

  const handleClearCache = () => {
    if (window.confirm("确定要清除历史进度吗？")) {
      setSeenTopicIds([]);
      setClickCount(0);
      setIsAllSeen(false);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CLICK_COUNT);
    }
  };

  const bgColorClass = clickCount % 2 !== 0 ? 'bg-freshGreen' : 'bg-pastelPink';

  const renderExtractTab = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-10 animate-in fade-in duration-500">
      <DisplayBox 
        topic={currentTopic} 
        isLoading={isLoading} 
        error={error}
        isAllSeen={isAllSeen}
      />
      
      <HeartButton onClick={handleExtractClick} disabled={isLoading} />
      
      <div className="flex flex-col items-center gap-3">
        <div className="text-white font-bold text-xs bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-inner">
          已探索: {seenTopicIds.filter(id => topics.some(t => t.id === id)).length} / {topics.length}
          {filteredTopics.length < topics.length && <span className="ml-1 opacity-70">(当前可用: {filteredTopics.length})</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {isOfflineMode ? (
            <div className="group relative">
               <button 
                onClick={() => loadTopics(sourceUrl)}
                disabled={isLoading}
                className="text-[10px] text-white/80 font-bold bg-orange-400/40 hover:bg-orange-400/60 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 transition-all"
               >
                 <span>⚠️ 离线模式</span>
                 <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
               </button>
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-darkGrey text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                 数据源: {fetchSource}
               </div>
            </div>
          ) : (
            <div className="text-[10px] text-white/50 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              云端同步中 ({fetchSource})
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderIndexTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-darkGrey mb-6 text-center">序号查找</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="number"
          value={searchIndex}
          onChange={(e) => setSearchIndex(e.target.value)}
          placeholder="话题编号"
          className="flex-1 px-4 py-3 rounded-xl border-2 border-white bg-white/80 text-darkGrey placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
        />
        <button 
          onClick={handleSearch}
          className="bg-darkGrey text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          🔍
        </button>
      </div>

      <div className="min-h-[150px] flex items-center justify-center bg-white/40 rounded-xl p-4 border border-white/50 text-center">
        {searchResult ? (
          <div>
             <span className="inline-block bg-pink-100 text-pink-500 text-[10px] font-black px-2 py-0.5 rounded-full mb-2">
               {searchResult.category}
             </span>
             <p className="text-lg font-bold text-darkGrey leading-relaxed">{searchResult.content}</p>
             {disabledCategories.includes(searchResult.category || '默认话题') && (
               <p className="text-[10px] text-orange-500 mt-2 font-bold">⚠️ 该分类目前已在设置中禁用</p>
             )}
          </div>
        ) : searchError ? (
          <p className="text-red-500 font-medium">{searchError}</p>
        ) : (
          <p className="text-darkGrey/40 italic text-sm">输入编号并点击搜索</p>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto max-h-[70vh]">
      <h2 className="text-2xl font-bold text-darkGrey mb-6 text-center">应用配置</h2>
      
      {/* 分类筛选器 */}
      <div className="mb-6">
        <label className="block text-darkGrey font-bold mb-3 ml-1 text-sm flex items-center gap-2">
          <span>🎨 话题分类显示筛选</span>
          <span className="text-[10px] font-normal text-gray-400 opacity-80">(点击切换显示/隐藏)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-white/30 rounded-2xl border border-white/50">
          {allCategories.length > 0 ? (
            allCategories.map(cat => {
              const isDisabled = disabledCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`
                    px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 border-2
                    ${!isDisabled 
                      ? 'bg-white border-pink-300 text-pink-500 shadow-sm' 
                      : 'bg-gray-100/50 border-gray-200 text-gray-400 opacity-60'}
                  `}
                >
                  {cat} {!isDisabled ? '●' : '○'}
                </button>
              );
            })
          ) : (
            <p className="text-[10px] text-gray-400 italic p-2">加载话题后即可进行分类筛选</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-darkGrey font-bold mb-2 ml-1 text-sm">Markdown 数据源 URL</label>
        <textarea
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full h-20 px-4 py-3 rounded-xl border-2 border-white bg-white/80 text-darkGrey text-[11px] focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all resize-none break-all"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={handleUrlSave} disabled={isLoading} className="w-full bg-darkGrey text-white py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg disabled:opacity-50">
          {isLoading ? '同步中...' : '同步并应用 URL'}
        </button>
        <button onClick={handleClearCache} className="w-full bg-white text-red-500 border-2 border-red-200 py-3 rounded-xl font-bold active:scale-95 transition-transform hover:bg-red-50">
          重置进度 (保留设置)
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-1000 ease-in-out ${bgColorClass} flex flex-col font-sans overflow-hidden select-none`}>
      <header className="pt-8 pb-4 px-6 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-md tracking-tight">
          情侣深度对话
        </h1>
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Deep Talks</p>
      </header>
      <main className={`flex-1 flex flex-col items-center justify-start pt-4 px-4 ${CONTENT_PADDING} overflow-y-auto`}>
        {currentTab === Tab.EXTRACT && renderExtractTab()}
        {currentTab === Tab.INDEX && renderIndexTab()}
        {currentTab === Tab.SETTINGS && renderSettingsTab()}
      </main>
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;
