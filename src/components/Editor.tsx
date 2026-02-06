'use client';

import { useRef, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { editorStore, useEditorStore } from '@/store/editorStore';
import Toolbar from './Toolbar';
import TopBar from './TopBar';
import PropertiesPanel from './PropertiesPanel';

export default function Editor() {
  const {
    canvasRef,
    selectedProps,
    canUndo,
    canRedo,
    undo,
    redo,
    importSVG,
    exportSVG,
    exportPNG,
    addImage,
    deleteSelected,
    duplicateSelected,
    updateSelectedObject,
    zoomTo,
    clearCanvas,
    resetToImportInitialState,
    bringForward,
    sendBackward,
  } = useCanvas();

  const zoom = useEditorStore((s) => s.zoom);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgString = ev.target?.result as string;
        if (svgString) importSVG(svgString);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importSVG]
  );

  const handleExportSVG = useCallback(() => {
    const svgData = exportSVG();
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSVG]);

  const handleExportPNG = useCallback(() => {
    const dataUrl = exportPNG();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'design.png';
    a.click();
  }, [exportPNG]);

  const handleImageAdd = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (url) addImage(url);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [addImage]
  );

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.1, 3);
    zoomTo(newZoom);
  }, [zoom, zoomTo]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.1, 0.1);
    zoomTo(newZoom);
  }, [zoom, zoomTo]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all elements from the canvas?')) {
      clearCanvas();
    }
  }, [clearCanvas]);

  // Handle drag & drop of files onto canvas
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const svgString = ev.target?.result as string;
          if (svgString) importSVG(svgString);
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          if (url) addImage(url);
        };
        reader.readAsDataURL(file);
      }
    },
    [importSVG, addImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="editor-layout">
      <TopBar
        onUndo={undo}
        onReset={resetToImportInitialState}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onImport={handleImport}
        onClear={handleClear}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onDuplicate={duplicateSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        zoom={zoom}
      />

      <div className="editor-main">
        <Toolbar onImageAdd={handleImageAdd} />

        <div
          className="canvas-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="canvas-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        <PropertiesPanel
          selected={selectedProps}
          onUpdate={updateSelectedObject}
          onDelete={deleteSelected}
        />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
