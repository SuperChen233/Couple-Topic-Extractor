import { Topic } from '../types';

export const fetchTopics = async (url: string): Promise<Topic[]> => {
  // Helper to process response
  const processResponse = async (response: Response) => {
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const text = await response.text();
    // Basic check to avoid parsing HTML error pages as topics
    if (text.trim().toLowerCase().startsWith("<!doctype") || text.trim().toLowerCase().startsWith("<html")) {
      throw new Error("Received HTML content instead of raw text");
    }
    return parseTopics(text);
  };

  // 1. Attempt: Direct Fetch
  try {
    const response = await fetch(url);
    return await processResponse(response);
  } catch (error) {
    console.warn("Direct fetch failed, trying Proxy 1 (AllOrigins)...", error);
  }

  // 2. Attempt: AllOrigins Proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.warn("AllOrigins failed, trying Proxy 2 (CorsProxy)...", error);
  }

  // 3. Attempt: CorsProxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.warn("CorsProxy failed, trying Proxy 3 (CodeTabs)...", error);
  }

  // 4. Attempt: CodeTabs Proxy
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    return await processResponse(response);
  } catch (error) {
    console.error("All proxies failed.", error);
  }

  throw new Error("Unable to load topics. The URL might be restricted or invalid (CORS/Network Error).");
};

const parseTopics = (text: string): Topic[] => {
  const lines = text.split('\n');
  let topics: Topic[] = [];

  // Strategy 1: Structured Parsing
  // Attempt to parse lines that start with a number followed by a separator.
  // Separators: . (dot), - (hyphen), space, or 、 (Chinese dunhao)
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Regex Explanation:
    // ^(\d+)       -> Starts with one or more digits (Group 1: ID)
    // [\.\-\s\u3001]+ -> Followed by dot, hyphen, space, or Chinese comma (one or more)
    // (.*)$        -> The rest of the line is the content (Group 2: Content)
    const match = trimmed.match(/^(\d+)[\.\-\s\u3001]+(.*)$/);
    
    if (match) {
      topics.push({
        id: parseInt(match[1], 10),
        content: match[2].trim(),
      });
    }
  });

  // Strategy 2: Fallback (Unnumbered List)
  // If strict parsing found NO topics (or very few compared to line count), 
  // assume the file is just a list of questions without numbers.
  // We treat every non-empty line as a topic and assign a sequential ID.
  if (topics.length === 0) {
    console.warn("Structured parsing found no topics. Switching to fallback mode (plain list).");
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed) {
        topics.push({
          id: index + 1, // Generate ID based on line number
          content: trimmed
        });
      }
    });
  }

  return topics;
};

export const getNextRandomTopic = (
  allTopics: Topic[],
  seenIds: number[]
): Topic | null => {
  const availableTopics = allTopics.filter(t => !seenIds.includes(t.id));
  
  if (availableTopics.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableTopics.length);
  return availableTopics[randomIndex];
};

export const getTopicById = (allTopics: Topic[], id: number): Topic | undefined => {
  return allTopics.find(t => t.id === id);
};