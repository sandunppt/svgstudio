'use client';

import {
  Undo2,
  RotateCcw,
  Redo2,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface TopBarProps {
  onUndo: () => void;
  onReset: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onImport: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  zoom: number;
}

export default function TopBar({
  onUndo,
  onReset,
  onRedo,
  canUndo,
  canRedo,
  onExportSVG,
  onExportPNG,
  onImport,
  onClear,
  onZoomIn,
  onZoomOut,
  onDuplicate,
  onBringForward,
  onSendBackward,
  zoom,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-section">
        <div className="topbar-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="2" fill="currentColor" />
            <path d="M7 17l3-4 2 2 3-4 4 6H7z" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="topbar-title">SVG Studio</span>
        </div>
      </div>

      <div className="topbar-section topbar-center">
        <div className="topbar-group">
          <button className="topbar-btn" onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>
            <Undo2 size={16} strokeWidth={1.5} />
          </button>
          <button className="topbar-btn" onClick={onReset} title="恢复导入初始状态">
            <RotateCcw size={16} strokeWidth={1.5} />
          </button>
          <button className="topbar-btn" onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}>
            <Redo2 size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="topbar-divider" />

        <div className="topbar-group">
          <button className="topbar-btn" onClick={onDuplicate} title="Duplicate (Ctrl+D)">
            <Copy size={16} strokeWidth={1.5} />
          </button>
          <button className="topbar-btn" onClick={onBringForward} title="Bring Forward">
            <ArrowUp size={16} strokeWidth={1.5} />
          </button>
          <button className="topbar-btn" onClick={onSendBackward} title="Send Backward">
            <ArrowDown size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="topbar-divider" />

        <div className="topbar-group">
          <button className="topbar-btn" onClick={onZoomOut} title="Zoom Out">
            <ZoomOut size={16} strokeWidth={1.5} />
          </button>
          <span className="topbar-zoom">{Math.round(zoom * 100)}%</span>
          <button className="topbar-btn" onClick={onZoomIn} title="Zoom In">
            <ZoomIn size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="topbar-section topbar-right">
        <button className="topbar-btn" onClick={onImport} title="Import SVG">
          <Upload size={16} strokeWidth={1.5} />
          <span>Import</span>
        </button>
        <button className="topbar-btn topbar-btn-export" onClick={onExportSVG} title="Export SVG">
          <Download size={16} strokeWidth={1.5} />
          <span>SVG</span>
        </button>
        <button className="topbar-btn topbar-btn-export" onClick={onExportPNG} title="Export PNG">
          <Download size={16} strokeWidth={1.5} />
          <span>PNG</span>
        </button>
        <button className="topbar-btn topbar-btn-danger" onClick={onClear} title="Clear Canvas">
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
