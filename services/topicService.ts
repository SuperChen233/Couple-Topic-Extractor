
import { Topic } from '../types';
import { BUILTIN_TOPICS_MD, FETCH_TIMEOUT_MS, LOCAL_STORAGE_KEYS } from '../constants';

const fetchWithTimeout = async (url: string, options = {}, timeout = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const fetchTopics = async (url: string): Promise<{ topics: Topic[], isOffline: boolean, source: string }> => {
  const processRawText = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      throw new Error("检测到无效响应（HTML而非文本）");
    }
    const parsed = parseMarkdownTopics(text);
    if (parsed.length === 0) {
      throw new Error("未能从文件中解析出话题列表");
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.CACHED_TOPICS, JSON.stringify(parsed));
    return parsed;
  };

  const attemptUrls = [
    { name: 'Direct', url: url },
    { name: 'CORSProxy.io', url: `https://corsproxy.io/?${encodeURIComponent(url)}` },
    { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
    { name: 'AllOrigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` }
  ];

  for (const attempt of attemptUrls) {
    try {
      const response = await fetchWithTimeout(attempt.url);
      if (response.ok) {
        const text = await response.text();
        const topics = processRawText(text);
        return { topics, isOffline: false, source: attempt.name };
      }
    } catch (e) {
      console.warn(`Source ${attempt.name} failed:`, e);
    }
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHED_TOPICS);
  if (cached) {
    try {
      const parsedCache = JSON.parse(cached);
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
        return { topics: parsedCache, isOffline: true, source: 'LocalStorage' };
      }
    } catch { /* ignore */ }
  }

  return { topics: parseMarkdownTopics(BUILTIN_TOPICS_MD), isOffline: true, source: 'Built-in' };
};

/**
 * 强力解析器：确保 ID 严格唯一且按序排列，避免逻辑跳变
 */
export const parseMarkdownTopics = (text: string): Topic[] => {
  const lines = text.split(/\r?\n/);
  let topics: Topic[] = [];
  let currentCategory = "默认话题";
  let internalIdCounter = 1; // 强制使用内部计数器确保 ID 唯一

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 分类标题解析
    const headerMatch = trimmed.match(/^#+\s*(.*)$/);
    if (headerMatch) {
      currentCategory = headerMatch[1].trim();
      return;
    }

    // 话题内容解析 (匹配 1. 内容 或 - 内容 或 (1) 内容)
    const topicContentMatch = trimmed.match(/^(?:[\(\（]?\d+[\)\）\.\-\s\u3001]+|[\-\*\+]\s+)?(.*)$/);
    if (topicContentMatch && topicContentMatch[1].trim().length > 1) {
      const content = topicContentMatch[1].trim();
      // 排除掉一些可能的 Markdown 标记
      if (!content.startsWith('![') && !content.startsWith('[')) {
        topics.push({
          id: internalIdCounter++,
          content: content,
          category: currentCategory
        });
      }
    }
  });

  return topics;
};

/**
 * 分类优先随机逻辑
 */
export const getNextRandomTopic = (filteredTopics: Topic[], seenIds: number[]): Topic | null => {
  // 过滤出未读的话题
  const availableTopics = filteredTopics.filter(t => !seenIds.includes(t.id));
  if (availableTopics.length === 0) return null;

  // 1. 提取有未读话题的分类
  const availableCategories = Array.from(new Set(availableTopics.map(t => t.category)));
  
  // 2. 随机选分类
  const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
  
  // 3. 从该分类中随机选一个话题
  const targetCategoryTopics = availableTopics.filter(t => t.category === randomCategory);
  return targetCategoryTopics[Math.floor(Math.random() * targetCategoryTopics.length)];
};

export const getTopicById = (allTopics: Topic[], id: number): Topic | undefined => {
  return allTopics.find(t => t.id === id);
};
