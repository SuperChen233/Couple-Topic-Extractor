
// 默认的话题源地址 (Gitee Raw 链接)
export const DEFAULT_SOURCE_URL = 'https://gitee.com/lansheng2020/deep-talk-topics/raw/master/DeepTalks.md';

// 本地存储 (localStorage) 的键名配置
export const LOCAL_STORAGE_KEYS = {
  SEEN_TOPICS: 'couple_topic_seen_ids', // 已看过的话题 ID 列表
  SOURCE_URL: 'couple_topic_source_url', // 用户自定义的源链接
  CLICK_COUNT: 'couple_topic_click_count', // 累计点击次数
  CACHED_TOPICS: 'couple_topic_cached_data', // 缓存的完整话题列表
};

// 预置的离线/兜底话题 (Markdown 格式)
export const BUILTIN_TOPICS_MD = `
# 甜蜜预热
1. 描述一下你第一次见到我时的心跳。
2. 如果我们可以立刻去一个地方旅行，你想去哪里？
3. 你最喜欢我身上的哪种味道？
4. 我们之间最让你难忘的一次约会是哪次？
5. 你觉得我们最像哪一对虚构的情侣（电影/动漫）？

# 深度链接
6. 你觉得一段健康的感情中，最不可或缺的三要素是什么？
7. 如果明天是世界末日，你最想和我一起做的最后一件事是什么？
8. 你在什么时候会觉得“啊，这辈子就是这个人了”？
9. 你觉得我做过最让你感动的一件小事是什么？
10. 我们在吵架时，你最希望我如何对待你？

# 未来愿景
11. 想象一下五年后我们的生活状态是什么样的？
12. 你理想中的“家”是什么样子的？
13. 你希望我们以后如何分担家务 and 责任？
14. 如果我们以后有了孩子，你希望自己是个什么样的父母？
15. 有没有什么事情是你一直想做但还没和我一起尝试的？
`;

export const FETCH_TIMEOUT_MS = 6000; // 网络请求超时时间 (6秒)
