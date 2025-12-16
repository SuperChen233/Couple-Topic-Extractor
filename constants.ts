// 默认的话题源地址 (Gitee Raw 链接)
export const DEFAULT_SOURCE_URL = 'https://gitee.com/lansheng2020/deep-talk-topics/raw/master/DeepTalks.txt';

// 本地存储 (localStorage) 的键名配置
export const LOCAL_STORAGE_KEYS = {
  SEEN_TOPICS: 'couple_topic_seen_ids', // 已看过的话题 ID 列表
  SOURCE_URL: 'couple_topic_source_url', // 用户自定义的源链接
  CLICK_COUNT: 'couple_topic_click_count', // 累计点击次数 (用于控制背景颜色)
};

// 颜色常量 (供逻辑参考，主要样式还是由 Tailwind CSS 类名控制)
export const COLORS = {
  FRESH_GREEN: '#98FB98', // 清新绿
  PASTEL_PINK: '#FFB6C1', // 柔和粉
};