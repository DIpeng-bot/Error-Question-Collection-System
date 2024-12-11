# 错题收集系统（Error Question Collection System）

## 项目简介

这是一个智能化的错题管理与学习系统，旨在帮助学生高效地收集、分析和复习错题。本系统采用现代化的教育理念和技术，为学生提供个性化的学习体验，帮助教师更好地了解学生的学习情况。

## 功能特性

### 用户系统
- 多角色支持（学生、教师）
- 班级管理功能
- 个人学习数据统计

### 错题管理
- 智能错题录入
  - 支持科目、章节等基本信息录入
  - 支持题目内容、答案的富文本编辑
  - 支持图片上传和OCR识别
  - 错因分析和知识点标签
- 错题本管理
  - 按科目/时间/状态/重要程度分类
  - 支持高级搜索和筛选
  - 支持编辑和删除功能
  - 错题关联推荐功能

### 学习辅助
- 基于艾宾浩斯遗忘曲线的复习提醒
- 错题分析报告
- 个性化练习题生成
- 学习进度追踪
- 知识点关联图谱

## 技术栈

- 前端框架: React 18
- 状态管理: Redux Toolkit
- UI组件库: Ant Design
- 富文本编辑器: TinyMCE
- 图表可视化: ECharts
- 本地存储: IndexedDB + LocalStorage

## 项目结构

```
src/
├── components/         # 可复用组件
│   ├── ErrorForm/     # 错题录入表单
│   ├── QuestionList/  # 错题列表
│   ├── TagSelector/   # 标签选择器
│   ├── Statistics/    # 统计分析组件
│   └── ReviewReminder/# 复习提醒组件
├── pages/             # 页面组件
│   ├── Home/         
│   ├── Management/    
│   ├── Analysis/      # 数据分析页面
│   └── Profile/       # 个人中心
├── models/            # 数据模型
├── services/          # 业务逻辑
├── utils/             # 工具函数
└── App.tsx           
```

## 数据模型

```typescript
// 用户模型
interface User {
  id: string;
  role: 'student' | 'teacher';
  name: string;
  class?: string;
  subjects: string[];
}

// 错题模型
interface ErrorQuestion {
  id: string;           // 唯一标识
  userId: string;       // 用户ID
  subject: string;      // 科目
  chapter: string;      // 章节
  questionType: string; // 题型
  difficulty: number;   // 难度等级 1-5
  importance: number;   // 重要程度 1-3
  content: {
    text: string;       // 题目文本
    images: string[];   // 题目图片
  };
  correctAnswer: string;// 正确答案
  wrongAnswer: string;  // 错误答案
  analysis: {
    errorType: string;  // 错误类型
    reason: string;     // 错误原因
    explanation: string;// 正确思路
  };
  tags: string[];       // 知识点标签
  createTime: Date;     // 创建时间
  reviewStatus: string; // 复习状态
  nextReviewTime: Date; // 下次复习时间
  reviewCount: number;  // 复习次数
}

// 学习进度模型
interface StudyProgress {
  userId: string;
  subject: string;
  totalQuestions: number;
  masteredQuestions: number;
  weakPoints: string[];
  lastReviewDate: Date;
}
```

## 开始使用

### 环境要求

- Node.js 16+
- npm 7+

### 安装步骤

1. 克隆项目
```bash
git clone [repository-url]
cd error-question-system
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:3000

## 开发计划

1. 第一阶段：基础功能实现（2周）
   - [ ] 用户系统搭建
   - [ ] 错题录入表单
   - [ ] 本地数据存储
   - [ ] 错题列表展示

2. 第二阶段：核心功能开发（3周）
   - [ ] 富文本编辑器集成
   - [ ] 图片上传和OCR
   - [ ] 标签系统
   - [ ] 复习提醒系统

3. 第三阶段：高级功能实现（3周）
   - [ ] 数据分析和可视化
   - [ ] 知识点图谱
   - [ ] 练习题生成器
   - [ ] 学习进度追踪

4. 第四阶段：优化和测试（2周）
   - [ ] 性能优化
   - [ ] 用户界面美化
   - [ ] 兼容性测试
   - [ ] 用户反馈收集

## 使用指南

### 学生用户
1. 注册/登录账号
2. 选择科目和班级
3. 录入错题（手动/OCR）
4. 设置复习提醒
5. 查看学习分析报告

### 教师用户
1. 注册/登录教师账号
2. 创建/管理班级
3. 查看学生错题情况
4. 生成班级分析报告
5. 推送复习建议

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 项目维护者：[待补充]
- 邮箱：[待补充]
- 项目仓库：[待补充]