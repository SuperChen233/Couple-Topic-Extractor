import { Topic } from '../types';

/**
 * 获取话题列表
 * 采用多重回退策略 (Fallback Strategy) 来解决跨域 (CORS) 和网络限制问题。
 * @param url 话题源的 URL
 * @returns 解析后的 Topic 数组
 */
export const fetchTopics = async (url: string): Promise<Topic[]> => {
  // 辅助函数：处理 Fetch 响应
  const processResponse = async (response: Response) => {
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const text = await response.text();
    // 基础检查：防止错误地解析 HTML 错误页面（例如 404 页面）
    if (text.trim().toLowerCase().startsWith("<!doctype") || text.trim().toLowerCase().startsWith("<html")) {
      throw new Error("Received HTML content instead of raw text");
    }
    return parseTopics(text);
  };

  // 1. 尝试：直接请求 (Direct Fetch)
  // 适用于同源 URL 或支持 CORS 的服务器
  try {
    const response = await fetch(url);
    return await processResponse(response);
  } catch (error) {
    console.warn("Direct fetch failed, trying Proxy 1 (AllOrigins)...", error);
  }

  // 2. 尝试：AllOrigins 代理
  // 一个免费的 CORS 代理服务
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.warn("AllOrigins failed, trying Proxy 2 (CorsProxy)...", error);
  }

  // 3. 尝试：CorsProxy.io 代理
  // 备用代理服务
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.warn("CorsProxy failed, trying Proxy 3 (CodeTabs)...", error);
  }

  // 4. 尝试：CodeTabs 代理
  // 最后的备用代理
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.error("All proxies failed.", error);
  }

  throw new Error("无法加载话题。URL 可能受限或无效 (CORS/网络错误)。");
};

/**
 * 解析文本内容为话题对象列表
 * @param text 原始文本内容
 */
const parseTopics = (text: string): Topic[] => {
  const lines = text.split('\n');
  let topics: Topic[] = [];

  // 策略 1: 结构化解析
  // 尝试解析以数字开头，后面跟着分隔符的行。
  // 支持的分隔符: . (点), - (横杠), 空格, 或 、 (中文顿号)
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 正则表达式解释:
    // ^(\d+)          -> 匹配行首的一个或多个数字 (捕获组 1: ID)
    // [\.\-\s\u3001]+ -> 匹配随后的点、横杠、空格或中文顿号
    // (.*)$           -> 匹配行的剩余部分 (捕获组 2: 内容)
    const match = trimmed.match(/^(\d+)[\.\-\s\u3001]+(.*)$/);
    
    if (match) {
      topics.push({
        id: parseInt(match[1], 10),
        content: match[2].trim(),
      });
    }
  });

  // 策略 2: 兜底方案 (无编号列表)
  // 如果结构化解析没有找到任何话题（或者文件格式不规范），
  // 假设文件只是纯文本问题列表。
  // 我们将每一行非空文本视为一个话题，并自动分配序号。
  if (topics.length === 0) {
    console.warn("结构化解析未找到话题，切换到兜底模式 (纯文本列表)。");
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed) {
        topics.push({
          id: index + 1, // 根据行号生成 ID
          content: trimmed
        });
      }
    });
  }

  return topics;
};

/**
 * 获取下一个随机话题
 * @param allTopics 所有话题列表
 * @param seenIds 已看过的话题 ID 列表
 */
export const getNextRandomTopic = (
  allTopics: Topic[],
  seenIds: number[]
): Topic | null => {
  // 过滤出未看过的话题
  const availableTopics = allTopics.filter(t => !seenIds.includes(t.id));
  
  if (availableTopics.length === 0) {
    return null;
  }

  // 随机选择一个索引
  const randomIndex = Math.floor(Math.random() * availableTopics.length);
  return availableTopics[randomIndex];
};

/**
 * 根据 ID 获取特定话题
 */
export const getTopicById = (allTopics: Topic[], id: number): Topic | undefined => {
  return allTopics.find(t => t.id === id);
};