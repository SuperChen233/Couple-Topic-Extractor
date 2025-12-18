
import { Topic } from '../types';
import { BUILTIN_TOPICS_MD, FETCH_TIMEOUT_MS, LOCAL_STORAGE_KEYS } from '../constants';

/**
 * 带超时功能的 fetch
 */
const fetchWithTimeout = async (url: string, options = {}, timeout = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      cache: 'no-cache' // 强制不走浏览器缓存，防止获取到旧的错误页面
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

/**
 * 核心：获取并验证话题
 */
export const fetchTopics = async (url: string): Promise<{ topics: Topic[], isOffline: boolean, source: string }> => {
  const processRawText = (text: string) => {
    const trimmed = text.trim();
    // 检查是否误拿到了 HTML 页面（比如 Gitee 的登录页或错误页）
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      throw new Error("检测到无效响应（HTML而非文本）");
    }
    const parsed = parseMarkdownTopics(text);
    if (parsed.length === 0) {
      throw new Error("未能从文件中解析出话题列表");
    }
    // 成功解析，存入缓存
    localStorage.setItem(LOCAL_STORAGE_KEYS.CACHED_TOPICS, JSON.stringify(parsed));
    return parsed;
  };

  // 尝试列表：直接 -> 代理1 -> 代理2 -> 代理3
  const attemptUrls = [
    { name: 'Direct', url: url },
    { name: 'CORSProxy.io', url: `https://corsproxy.io/?${encodeURIComponent(url)}` },
    { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
    { name: 'AllOrigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` }
  ];

  for (const attempt of attemptUrls) {
    try {
      console.log(`Trying source: ${attempt.name}`);
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

  // 所有网络尝试失败 -> 尝试缓存
  const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHED_TOPICS);
  if (cached) {
    try {
      const parsedCache = JSON.parse(cached);
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
        return { topics: parsedCache, isOffline: true, source: 'LocalStorage' };
      }
    } catch { /* ignore */ }
  }

  // 最终兜底 -> 内置
  return { topics: parseMarkdownTopics(BUILTIN_TOPICS_MD), isOffline: true, source: 'Built-in' };
};

/**
 * 解析 Markdown 内容 (增强正则兼容性)
 */
export const parseMarkdownTopics = (text: string): Topic[] => {
  const lines = text.split(/\r?\n/);
  let topics: Topic[] = [];
  let currentCategory = "默认话题";
  let globalAutoId = 1;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 匹配标题
    const headerMatch = trimmed.match(/^#+\s*(.*)$/);
    if (headerMatch) {
      currentCategory = headerMatch[1].trim();
      return;
    }

    // 匹配有序列表: 1. 或 1、 或 (1)
    const topicMatch = trimmed.match(/^[\(\（]?(\d+)[\)\）\.\-\s\u3001]+(.*)$/);
    if (topicMatch) {
      topics.push({
        id: parseInt(topicMatch[1], 10),
        content: topicMatch[2].trim(),
        category: currentCategory
      });
      globalAutoId = Math.max(globalAutoId, parseInt(topicMatch[1], 10) + 1);
    } else if (trimmed.length > 2 && !trimmed.startsWith('![')) {
      // 兜底非编号行（如果是纯文本且够长，自动分配编号）
      if (!trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('>') && !trimmed.startsWith('#')) {
        topics.push({
          id: globalAutoId++,
          content: trimmed,
          category: currentCategory
        });
      }
    }
  });

  return topics;
};

export const getNextRandomTopic = (allTopics: Topic[], seenIds: number[]): Topic | null => {
  const availableTopics = allTopics.filter(t => !seenIds.includes(t.id));
  if (availableTopics.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableTopics.length);
  return availableTopics[randomIndex];
};

export const getTopicById = (allTopics: Topic[], id: number): Topic | undefined => {
  return allTopics.find(t => t.id === id);
};
