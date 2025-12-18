
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

  // 检索页状态
  const [searchIndex, setSearchIndex] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Topic | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<string>('all');

  // 所有分类
  const allCategories = useMemo(() => {
    return Array.from(new Set(topics.map(t => t.category || '默认话题'))).sort();
  }, [topics]);

  // 当前启用的分类话题
  const filteredTopics = useMemo(() => {
    return topics.filter(t => !disabledCategories.includes(t.category || '默认话题'));
  }, [topics, disabledCategories]);

  // 全量库已读数 (去重并校验存在性)
  const globalSeenCount = useMemo(() => {
    const currentIds = new Set(topics.map(t => t.id));
    return seenTopicIds.filter(id => currentIds.has(id)).length;
  }, [seenTopicIds, topics]);

  // 当前范围内未读数
  const unreadInScope = useMemo(() => {
    return filteredTopics.filter(t => !seenTopicIds.includes(t.id)).length;
  }, [filteredTopics, seenTopicIds]);

  const loadTopics = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { topics: data, isOffline, source } = await fetchTopics(url);
      setTopics(data);
      setIsOfflineMode(isOffline);
      setFetchSource(source);
      // 加载新源后，清理不存在的已读 ID
      const validIds = new Set(data.map(t => t.id));
      setSeenTopicIds(prev => prev.filter(id => validIds.has(id)));
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
        const parsed = JSON.parse(savedSeen);
        setSeenTopicIds(Array.isArray(parsed) ? Array.from(new Set(parsed)) : []);
      } catch { setSeenTopicIds([]); }
    }
    if (savedClicks) setClickCount(parseInt(savedClicks, 10));
    if (savedDisabled) {
      try { setDisabledCategories(JSON.parse(savedDisabled)); } catch { setDisabledCategories([]); }
    }
    loadTopics(savedUrl || DEFAULT_SOURCE_URL);
  }, []);

  const handleExtractClick = useCallback(() => {
    if (unreadInScope === 0) {
      if (filteredTopics.length === 0) {
        setError("当前分类已全部屏蔽");
      }
      return;
    }

    setError(null);
    taskManager.check_special_task();

    const nextTopic = getNextRandomTopic(filteredTopics, seenTopicIds);

    if (nextTopic) {
      setCurrentTopic(nextTopic);
      
      // 使用函数式更新确保计数准确
      setSeenTopicIds(prev => {
        const newSet = new Set([...prev, nextTopic.id]);
        const newArr = Array.from(newSet);
        localStorage.setItem(LOCAL_STORAGE_KEYS.SEEN_TOPICS, JSON.stringify(newArr));
        return newArr;
      });

      const newCount = clickCount + 1;
      setClickCount(newCount);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CLICK_COUNT, newCount.toString());
    }
  }, [unreadInScope, filteredTopics, seenTopicIds, clickCount]);

  const handleSearch = () => {
    const id = parseInt(searchIndex, 10);
    if (isNaN(id)) {
      setSearchError('请输入数字');
      setSearchResult(null);
      return;
    }
    const found = getTopicById(topics, id);
    if (found) {
      setSearchResult(found);
      setSearchError(null);
      setSelectedBrowseCategory(found.category);
    } else {
      setSearchResult(null);
      setSearchError('未找到该话题');
    }
  };

  const browseList = useMemo(() => {
    if (selectedBrowseCategory === 'all') return [];
    return topics.filter(t => t.category === selectedBrowseCategory);
  }, [topics, selectedBrowseCategory]);

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
    if (currentTopic && newDisabled.includes(currentTopic.category || '默认话题')) {
      setCurrentTopic(null);
    }
  };

  const handleClearCache = () => {
    if (window.confirm("确定要清除历史进度吗？")) {
      setSeenTopicIds([]);
      setClickCount(0);
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
        isAllSeen={unreadInScope === 0 && filteredTopics.length > 0}
      />
      
      <HeartButton onClick={handleExtractClick} disabled={isLoading || (unreadInScope === 0 && filteredTopics.length > 0)} />
      
      <div className="flex flex-col items-center gap-3">
        <div className="text-white font-bold text-[11px] bg-black/10 px-6 py-2 rounded-full backdrop-blur-sm shadow-inner flex flex-col items-center gap-1 min-w-[180px]">
          <div className="flex justify-between w-full gap-8">
            <span>总已读:</span>
            <span>{globalSeenCount} / {topics.length}</span>
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-1">
             <div 
               className="h-full bg-white transition-all duration-500" 
               style={{ width: `${(globalSeenCount / (topics.length || 1)) * 100}%` }}
             ></div>
          </div>
          <p className="text-[9px] opacity-70 mt-1 uppercase tracking-widest">
            当前分类剩余: {unreadInScope}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-white/50 font-bold flex items-center gap-1">
            <span className={isLoading ? "animate-spin" : "w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"}>
              {isLoading ? "🔄" : ""}
            </span>
            {isLoading ? "同步数据中..." : `云端已就绪 (${fetchSource})`}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIndexTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[75vh]">
      <h2 className="text-xl font-black text-darkGrey mb-4 text-center tracking-tight">话题浏览室</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="number"
          value={searchIndex}
          onChange={(e) => setSearchIndex(e.target.value)}
          placeholder="输入 ID"
          className="w-24 px-4 py-2.5 rounded-xl border-2 border-white bg-white/80 text-darkGrey font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
        />
        <button 
          onClick={handleSearch}
          className="flex-1 bg-darkGrey text-white py-2.5 rounded-xl font-bold active:scale-95 transition-transform text-xs shadow-md"
        >
          🔍 精准定位
        </button>
      </div>

      <div className="mb-4">
        <select 
          value={selectedBrowseCategory}
          onChange={(e) => {
            setSelectedBrowseCategory(e.target.value);
            setSearchResult(null);
          }}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-white bg-white/80 text-darkGrey font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234A4A4A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.6rem auto' }}
        >
          <option value="all">-- 请选择分类浏览 --</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat} ({topics.filter(t => t.category === cat).length}条)</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto bg-white/40 rounded-2xl p-4 border border-white/50 shadow-inner">
        {searchResult ? (
          <div className="bg-white/80 p-4 rounded-xl shadow-sm border-l-4 border-pink-400 mb-4 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black bg-pink-100 text-pink-500 px-2 py-0.5 rounded uppercase">{searchResult.category}</span>
               <span className="text-[10px] text-gray-300 font-bold">ID: {searchResult.id}</span>
             </div>
             <p className="text-sm font-bold text-darkGrey">{searchResult.content}</p>
          </div>
        ) : searchError && (
          <p className="text-red-500 text-xs font-bold text-center py-2">{searchError}</p>
        )}

        {browseList.length > 0 ? (
          <div className="space-y-2">
            {browseList.map(item => (
              <div 
                key={item.id} 
                className={`p-3 rounded-xl border transition-all ${searchResult?.id === item.id ? 'bg-pink-50 border-pink-200 scale-105 shadow-md' : 'bg-white/40 border-white/60 hover:bg-white/60'}`}
              >
                <div className="flex gap-3">
                  <span className="text-[9px] font-black text-pink-300 bg-white px-1.5 py-0.5 rounded shadow-sm h-fit">#{item.id}</span>
                  <p className="text-xs font-bold text-darkGrey leading-tight">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : selectedBrowseCategory !== 'all' ? (
          <p className="text-center text-gray-300 italic text-xs py-10">该分类下暂无内容</p>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-darkGrey/20 italic space-y-4 py-10">
            <span className="text-5xl">🔭</span>
            <p className="text-xs font-bold">选择分类或搜索 ID 开始探索</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border-2 border-white animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto max-h-[75vh]">
      <h2 className="text-xl font-black text-darkGrey mb-6 text-center">系统实验室</h2>
      
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <label className="text-darkGrey font-black text-xs uppercase tracking-tighter">
            🎨 分类过滤器
          </label>
          <div className="flex gap-4">
             <button onClick={() => toggleAllCategories(false)} className="text-[10px] text-pink-500 font-black">全部显示</button>
             <button onClick={() => toggleAllCategories(true)} className="text-[10px] text-gray-400 font-black">全部隐藏</button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {allCategories.map(cat => {
            const isDisabled = disabledCategories.includes(cat);
            const count = topics.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all border-2 ${!isDisabled ? 'bg-white border-white shadow-sm' : 'bg-gray-100/30 border-transparent opacity-40'}`}
              >
                <div className="text-left">
                  <span className="text-sm font-black text-darkGrey">{cat}</span>
                  <p className="text-[9px] font-bold text-gray-400">{count} 条话题</p>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${!isDisabled ? 'bg-pink-400' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${!isDisabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8 border-t border-white/40 pt-6">
        <label className="block text-darkGrey font-black text-xs uppercase mb-2 ml-1">远程数据源</label>
        <textarea
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full h-20 px-4 py-3 rounded-xl border-2 border-white bg-white/80 text-darkGrey text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all resize-none break-all"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={handleUrlSave} disabled={isLoading} className="w-full bg-darkGrey text-white py-4 rounded-2xl font-black active:scale-95 transition-transform shadow-lg disabled:opacity-50">
          {isLoading ? 'SYNCING...' : '同步云端数据'}
        </button>
        <button onClick={handleClearCache} className="w-full bg-white text-red-500 border-2 border-red-100 py-4 rounded-2xl font-black active:scale-95 transition-transform hover:bg-red-50">
          清除已读历史
        </button>
      </div>
      
      <p className="text-center text-[9px] text-gray-300 mt-6 font-black uppercase tracking-widest">Version 1.4.0 • Stable</p>
    </div>
  );

  const toggleAllCategories = (disableAll: boolean) => {
    const newDisabled = disableAll ? [...allCategories] : [];
    setDisabledCategories(newDisabled);
    localStorage.setItem(LOCAL_STORAGE_KEYS.DISABLED_CATEGORIES, JSON.stringify(newDisabled));
    if (disableAll) setCurrentTopic(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ease-in-out ${bgColorClass} flex flex-col font-sans overflow-hidden select-none`}>
      <header className="pt-8 pb-4 px-6 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-md tracking-tight">
          情侣深度对话
        </h1>
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Connection Engine</p>
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
