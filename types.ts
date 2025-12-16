// 话题对象定义
export interface Topic {
  id: number;       // 话题序号
  content: string;  // 话题内容
}

// 标签页枚举
export enum Tab {
  EXTRACT = 'EXTRACT',   // 抽取页
  INDEX = 'INDEX',       // 检索页
  SETTINGS = 'SETTINGS', // 设置页
}

// 应用整体状态接口 (参考用，实际状态在 App.tsx 中通过 hooks 管理)
export interface AppState {
  topics: Topic[];              // 所有话题
  seenTopicIds: number[];       // 已看过的 ID
  clickCount: number;           // 点击次数
  sourceUrl: string;            // 数据源 URL
  isLoading: boolean;           // 是否加载中
  error: string | null;         // 错误信息
  currentTopic: Topic | null;   // 当前展示的话题
}