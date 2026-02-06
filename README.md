# SVG Studio

基于 Next.js + Fabric.js 的现代化 SVG 在线编辑器，主要针对SVG PPT编辑，支持图形绘制、文字编辑、路径导入、智能对齐和 SVG/PNG 导出。

## 功能特性

- 基础绘制工具：矩形、圆形、三角形、直线、文字、画笔
- SVG 导入：保留层级与分组，支持复杂 SVG 解析
- 导出能力：导出为 SVG / PNG
- 编辑能力：移动、缩放、旋转、层级调整、复制、删除
- 组合编辑：双击进入组内编辑，支持子元素操作
- 智能辅助线：拖拽时同级元素自动对齐
- 右侧属性面板（中文）：按元素类型展示对应编辑项
- 历史能力：撤销 / 重做 / 恢复导入时初始状态

## 演示图片

![](https://github.com/sandunppt/svgstudio/blob/main/demo/1.png)
![](https://github.com/sandunppt/svgstudio/blob/main/demo/2.png)
![](https://github.com/sandunppt/svgstudio/blob/main/demo/3.png)
![](https://github.com/sandunppt/svgstudio/blob/main/demo/4.png)

可以使用demo文件夹内的demo.svg进行测试

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

## Docker 部署

### 1. 直接使用 Docker

```bash
docker build -t modern-svg-editor .
docker run -d --name modern-svg-editor -p 5999:5999 modern-svg-editor
```

### 2. 使用 Docker Compose

```bash
docker compose up -d --build
```

默认访问地址：`http://localhost:5999`

停止服务：

```bash
docker compose down
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
- [svgedit](https://github.com/SVG-Edit/svgedit)

