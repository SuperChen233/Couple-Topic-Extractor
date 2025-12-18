
// 话题对象定义
export interface Topic {
  id: number;       // 话题序号
  content: string;  // 话题内容
  category: string; // 话题分类 (从 Markdown 标题解析)
}

// 标签页枚举
export enum Tab {
  EXTRACT = 'EXTRACT',   // 抽取页
  INDEX = 'INDEX',       // 检索页
  SETTINGS = 'SETTINGS', // 设置页
}

// 应用整体状态接口
export interface AppState {
  topics: Topic[];              // 所有话题
  seenTopicIds: number[];       // 已看过的 ID
  clickCount: number;           // 点击次数
  sourceUrl: string;            // 数据源 URL
  isLoading: boolean;           // 是否加载中
  error: string | null;         // 错误信息
  currentTopic: Topic | null;   // 当前展示的话题
}
