import { useSyncExternalStore } from 'react';
import { Tool, EditorState } from '@/types/editor';

type Listener = () => void;

class EditorStore {
  private state: EditorState = {
    activeTool: 'select',
    fillColor: '#3b82f6',
    strokeColor: '#1e293b',
    strokeWidth: 2,
    fontSize: 24,
    fontFamily: 'Inter, sans-serif',
    opacity: 1,
    zoom: 1,
  };

  private listeners: Set<Listener> = new Set();

  getState(): EditorState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  setTool(tool: Tool) {
    this.state = { ...this.state, activeTool: tool };
    this.emit();
  }

  setFillColor(color: string) {
    this.state = { ...this.state, fillColor: color };
    this.emit();
  }

  setStrokeColor(color: string) {
    this.state = { ...this.state, strokeColor: color };
    this.emit();
  }

  setStrokeWidth(width: number) {
    this.state = { ...this.state, strokeWidth: width };
    this.emit();
  }

  setFontSize(size: number) {
    this.state = { ...this.state, fontSize: size };
    this.emit();
  }

  setFontFamily(family: string) {
    this.state = { ...this.state, fontFamily: family };
    this.emit();
  }

  setOpacity(opacity: number) {
    this.state = { ...this.state, opacity: opacity };
    this.emit();
  }

  setZoom(zoom: number) {
    this.state = { ...this.state, zoom: zoom };
    this.emit();
  }
}

export const editorStore = new EditorStore();

const subscribe = editorStore.subscribe.bind(editorStore);
const getSnapshotFull = () => editorStore.getState();

export function useEditorStore<T = EditorState>(
  selector?: (state: EditorState) => T
): T {
  return useSyncExternalStore(
    subscribe,
    selector ? () => selector(editorStore.getState()) : (getSnapshotFull as () => T),
    selector ? () => selector(editorStore.getState()) : (getSnapshotFull as () => T)
  );
}
