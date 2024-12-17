# 错题收集系统

一个帮助学生高效管理和学习错题的系统。

## 功能特点

- 错题录入：支持富文本编辑，可添加图片和数学公式
- 错题管理：可按科目、章节、难度等多维度管理错题
- 知识点标签：支持为错题添加自定义标签
- 错误分析：包含错误类型、原因和正确思路的详细分析

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- React Quill
- IndexedDB (通过 idb 库)
- React Router 6
- Redux Toolkit

## 开始使用

1. 克隆项目
```bash
git clone [repository-url]
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
  ├── components/      # 可复用组件
  ├── models/         # TypeScript 类型定义
  ├── pages/          # 页面组件
  ├── services/       # 服务层（存储、状态管理等）
  └── styles/         # 全局样式
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT