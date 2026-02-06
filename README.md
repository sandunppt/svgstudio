# Modern SVG Editor

基于 Next.js + Fabric.js 的现代化 SVG 在线编辑器，支持图形绘制、文字编辑、路径导入、智能对齐和 SVG/PNG 导出。

## 功能特性

- 基础绘制工具：矩形、圆形、三角形、直线、文字、画笔
- SVG 导入：保留层级与分组，支持复杂 SVG 解析
- 导出能力：导出为 SVG / PNG
- 编辑能力：移动、缩放、旋转、层级调整、复制、删除
- 组合编辑：双击进入组内编辑，支持子元素操作
- 智能辅助线：拖拽时同级元素自动对齐
- 右侧属性面板（中文）：按元素类型展示对应编辑项
- 历史能力：撤销 / 重做 / 恢复导入时初始状态

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Fabric.js 6
- Lucide React

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认地址：`http://localhost:5999`

### 3. 生产构建

```bash
npm run build
npm run start
```

## NPM 脚本

- `npm run dev`：开发模式（端口 5999）
- `npm run build`：生产构建
- `npm run start`：生产运行（端口 5999）
- `npm run lint`：代码检查

## 项目结构

```text
src/
  app/                # Next.js App Router 页面与全局样式
  components/         # 编辑器 UI（TopBar/Toolbar/PropertiesPanel）
  hooks/              # 核心编辑逻辑（Fabric 画布、导入导出、历史、对齐）
  store/              # 编辑器状态管理
  types/              # 类型定义
```

## 开源发布到 GitHub（一步步）

如果你还没初始化 Git 仓库，可在项目根目录执行：

```bash
git init
git add .
git commit -m "feat: initial modern svg editor"
```

在 GitHub 创建一个新仓库（例如 `modern-svg-editor`）后执行：

```bash
git branch -M main
git remote add origin https://github.com/<your-name>/modern-svg-editor.git
git push -u origin main
```

如果你已经有 Git 仓库，只需要：

```bash
git add .
git commit -m "docs: update README for open-source release"
git push
```

## 开源建议（推荐）

- 添加 `LICENSE`（推荐 MIT）
- 在 GitHub 仓库设置里补充：
  - Description
  - Topics（如 `svg`、`editor`、`fabricjs`、`nextjs`）
  - Homepage（如果有在线地址）
- 创建首个 Release（如 `v0.1.0`）

## 贡献

欢迎提交 Issue 和 PR。

建议流程：

1. Fork 仓库
2. 创建分支：`feature/xxx` 或 `fix/xxx`
3. 提交变更并附说明
4. 发起 Pull Request

## 致谢

- [Fabric.js](https://fabricjs.com/)
- [Next.js](https://nextjs.org/)
- [Lucide](https://lucide.dev/)

