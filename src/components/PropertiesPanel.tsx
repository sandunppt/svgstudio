'use client';

import { useEffect, useState } from 'react';
import { SelectedObjectProps } from '@/types/editor';
import {
  Move,
  Maximize2,
  RotateCw,
  Palette,
  PenLine,
  Eye,
  Type,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface PropertiesPanelProps {
  selected: SelectedObjectProps | null;
  onUpdate: (props: Partial<SelectedObjectProps>) => void;
  onDelete: () => void;
}

interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#1e293b', '#0ea5e9', '#14b8a6', '#a855f7', '#f43f5e',
  'transparent',
];

const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '\'Courier New\', monospace', label: 'Courier New' },
  { value: '\'Times New Roman\', serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'PingFang SC, sans-serif', label: 'PingFang SC' },
  { value: 'Microsoft YaHei, sans-serif', label: 'Microsoft YaHei' },
];

export default function PropertiesPanel({ selected, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="properties-panel">
        <div className="properties-empty">
          <div className="properties-empty-icon">
            <MousePointerIcon />
          </div>
          <p className="properties-empty-text">请选择一个元素后进行属性编辑</p>
        </div>
      </div>
    );
  }

  const isText = selected.type === 'i-text' || selected.type === 'text';
  const isGroup = selected.type === 'group';
  const hideFill = selected.type === 'line' || selected.type === 'path' || selected.type === 'polyline';

  const renderPositionSection = () => (
    <div className="prop-section">
      <div className="prop-section-title">
        <Move size={13} strokeWidth={1.5} />
        <span>位置</span>
      </div>
      <div className="prop-grid">
        <div className="prop-field">
          <label>X</label>
          <NumberField value={selected.left} onCommit={(value) => onUpdate({ left: value })} step={1} />
        </div>
        <div className="prop-field">
          <label>Y</label>
          <NumberField value={selected.top} onCommit={(value) => onUpdate({ top: value })} step={1} />
        </div>
      </div>
    </div>
  );

  const renderTextColorSection = () => (
    <div className="prop-section">
      <div className="prop-section-title">
        <Palette size={13} strokeWidth={1.5} />
        <span>文字颜色</span>
      </div>
      <div className="color-picker-row">
        <input
          type="color"
          value={selected.fill === 'transparent' ? '#ffffff' : selected.fill}
          onChange={(e) => onUpdate({ fill: e.target.value })}
          className="color-input"
        />
        <input
          type="text"
          value={selected.fill}
          onChange={(e) => onUpdate({ fill: e.target.value })}
          className="color-text"
        />
      </div>
      <div className="color-swatches">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className={`color-swatch ${color === 'transparent' ? 'color-swatch-transparent' : ''} ${selected.fill === color ? 'active' : ''}`}
            style={{ backgroundColor: color === 'transparent' ? undefined : color }}
            onClick={() => onUpdate({ fill: color })}
            title={color}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <span className="properties-type">{getTypeLabel(selected.type)}</span>
        <button className="properties-delete" onClick={onDelete} title="删除">
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>

      {isText ? (
        <>
          <div className="prop-section">
            <div className="prop-section-title">
              <Type size={13} strokeWidth={1.5} />
              <span>文字样式</span>
            </div>
            <div className="prop-field prop-field-full">
              <label>字体</label>
              <select
                value={selected.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="prop-select prop-select-inline"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>
            <div className="prop-field prop-field-full">
              <label>字号</label>
              <NumberField
                value={selected.fontSize || 24}
                onCommit={(value) => onUpdate({ fontSize: value })}
                min={8}
                max={200}
                step={1}
              />
              <span className="prop-unit">px</span>
            </div>
          </div>

          <div className="prop-section">
            <div className="prop-section-title">
              <Type size={13} strokeWidth={1.5} />
              <span>内容</span>
            </div>
            <textarea
              className="prop-select"
              rows={3}
              value={selected.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              style={{ width: '100%', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
            />
          </div>

          {renderTextColorSection()}
          {renderPositionSection()}
        </>
      ) : (
        <>
          {renderPositionSection()}

          <div className="prop-section">
            <div className="prop-section-title">
              <Maximize2 size={13} strokeWidth={1.5} />
              <span>尺寸</span>
            </div>
            <div className="prop-grid">
              <div className="prop-field">
                <label>宽</label>
                <input type="number" value={selected.width} readOnly />
              </div>
              <div className="prop-field">
                <label>高</label>
                <input type="number" value={selected.height} readOnly />
              </div>
            </div>
          </div>

          <div className="prop-section">
            <div className="prop-section-title">
              <RotateCw size={13} strokeWidth={1.5} />
              <span>旋转</span>
            </div>
            <div className="prop-field prop-field-full">
              <label>角度</label>
              <NumberField
                value={selected.angle}
                onCommit={(value) => onUpdate({ angle: value })}
                min={0}
                max={360}
                step={1}
              />
            </div>
          </div>

          {!isGroup && !hideFill && (
            <div className="prop-section">
              <div className="prop-section-title">
                <Palette size={13} strokeWidth={1.5} />
                <span>填充</span>
              </div>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={selected.fill === 'transparent' ? '#ffffff' : selected.fill}
                  onChange={(e) => onUpdate({ fill: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={selected.fill}
                  onChange={(e) => onUpdate({ fill: e.target.value })}
                  className="color-text"
                />
              </div>
              <div className="prop-slider-row">
                <span className="prop-slider-label">不透明度</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selected.fillOpacity ?? 1}
                  onChange={(e) => onUpdate({ fillOpacity: Number(e.target.value) })}
                  className="prop-slider"
                />
                <span className="prop-slider-value">{Math.round((selected.fillOpacity ?? 1) * 100)}%</span>
              </div>
              <div className="color-swatches">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`color-swatch ${color === 'transparent' ? 'color-swatch-transparent' : ''} ${selected.fill === color ? 'active' : ''}`}
                    style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                    onClick={() => onUpdate({ fill: color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {!isGroup && (
            <div className="prop-section">
              <div className="prop-section-title">
                <PenLine size={13} strokeWidth={1.5} />
                <span>边框</span>
              </div>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={selected.stroke === 'transparent' ? '#000000' : selected.stroke}
                  onChange={(e) => onUpdate({ stroke: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={selected.stroke}
                  onChange={(e) => onUpdate({ stroke: e.target.value })}
                  className="color-text"
                />
              </div>
              <div className="prop-slider-row">
                <span className="prop-slider-label">不透明度</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selected.strokeOpacity ?? 1}
                  onChange={(e) => onUpdate({ strokeOpacity: Number(e.target.value) })}
                  className="prop-slider"
                />
                <span className="prop-slider-value">{Math.round((selected.strokeOpacity ?? 1) * 100)}%</span>
              </div>
              <div className="prop-field prop-field-full">
                <label>宽度</label>
                <NumberField
                  value={selected.strokeWidth}
                  onCommit={(value) => onUpdate({ strokeWidth: value })}
                  min={0}
                  max={50}
                  step={0.5}
                />
                <span className="prop-unit">px</span>
              </div>
            </div>
          )}

          <div className="prop-section">
            <div className="prop-section-title">
              <Eye size={13} strokeWidth={1.5} />
              <span>透明度</span>
            </div>
            <div className="prop-slider-row">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selected.opacity}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
                className="prop-slider"
              />
              <span className="prop-slider-value">{Math.round(selected.opacity * 100)}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NumberField({ value, onCommit, min, max, step = 1 }: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (num: number) => {
    let next = num;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const commit = (raw: string) => {
    if (raw.trim() === '' || raw === '-' || raw === '.' || raw === '-.') {
      setDraft(String(value));
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    if (Math.abs(next - value) > 1e-9) {
      onCommit(next);
    }
    setDraft(String(next));
  };

  const nudge = (delta: number) => {
    const base = Number.isNaN(Number(draft)) || draft.trim() === '' ? value : Number(draft);
    const next = clamp(base + delta);
    if (Math.abs(next - value) > 1e-9) {
      onCommit(next);
    }
    setDraft(String(next));
  };

  return (
    <div className="prop-number-control">
      <input
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        className="prop-number-input"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(draft);
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            nudge(step);
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(-step);
          }
        }}
      />
      <div className="prop-number-stepper">
        <button
          type="button"
          className="prop-number-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => nudge(step)}
          aria-label="增加"
          title="增加"
        >
          <ChevronUp size={10} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="prop-number-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => nudge(-step)}
          aria-label="减少"
          title="减少"
        >
          <ChevronDown size={10} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rect: '矩形',
    circle: '圆形',
    triangle: '三角形',
    line: '线条',
    'i-text': '文本',
    text: '文本',
    image: '图片',
    path: '路径',
    group: '组合',
    polygon: '多边形',
    polyline: '折线',
    ellipse: '椭圆',
    activeSelection: '多选',
  };
  return labels[type] || '元素';
}

function MousePointerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}
