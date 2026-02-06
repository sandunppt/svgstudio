'use client';

import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Minus,
  Type,
  Image,
  Pen,
} from 'lucide-react';
import { Tool } from '@/types/editor';
import { editorStore, useEditorStore } from '@/store/editorStore';

const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'rectangle', icon: Square, label: '矩形' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'triangle', icon: Triangle, label: '三角形' },
  { id: 'line', icon: Minus, label: '直线' },
  { id: 'text', icon: Type, label: '文字' },
  { id: 'image', icon: Image, label: '图片' },
  { id: 'pen', icon: Pen, label: '画笔' },
];

interface ToolbarProps {
  onImageAdd: () => void;
}

export default function Toolbar({ onImageAdd }: ToolbarProps) {
  const activeTool = useEditorStore((s) => s.activeTool);

  const handleToolClick = (tool: Tool) => {
    if (tool === 'image') {
      onImageAdd();
      return;
    }
    editorStore.setTool(tool);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-inner">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`toolbar-btn ${activeTool === id ? 'active' : ''}`}
            onClick={() => handleToolClick(id)}
            title={label}
          >
            <Icon size={20} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}
