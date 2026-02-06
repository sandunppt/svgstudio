import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, Rect, Circle, Triangle, Line, IText, FabricImage, PencilBrush, FabricObject, ActiveSelection, Point } from 'fabric';
import { editorStore } from '@/store/editorStore';
import { Tool, SelectedObjectProps } from '@/types/editor';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const isDrawingShape = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const currentShape = useRef<FabricObject | null>(null);
  const editingGroupRef = useRef<FabricObject | null>(null);
  const [selectedProps, setSelectedProps] = useState<SelectedObjectProps | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const importInitialStateRef = useRef<string | null>(null);
  const isUndoRedo = useRef(false);
  const isImporting = useRef(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: undoStack.current.length > 1,
      canRedo: redoStack.current.length > 0,
    });
  }, []);

  const saveState = useCallback(() => {
    if (isUndoRedo.current || isImporting.current || !fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    undoStack.current.push(json);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    updateHistoryState();
  }, [updateHistoryState]);

  const updateSelectedProps = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) {
      setSelectedProps(null);
      return;
    }

    const bound = active.getBoundingRect();
    const props: SelectedObjectProps = {
      type: active.type || 'object',
      left: Math.round(active.left || 0),
      top: Math.round(active.top || 0),
      width: Math.round(bound.width),
      height: Math.round(bound.height),
      angle: Math.round(active.angle || 0),
      fill: (active.fill as string) || 'transparent',
      fillOpacity: (active as any).fillOpacity ?? ((active.fill as string) === 'transparent' ? 0 : 1),
      stroke: (active.stroke as string) || 'transparent',
      strokeOpacity: (active as any).strokeOpacity ?? ((active.stroke as string) === 'transparent' ? 0 : 1),
      strokeWidth: active.strokeWidth || 0,
      opacity: active.opacity ?? 1,
      svgString: active.toSVG(),
    };

    if (active.type === 'i-text' || active.type === 'text') {
      const textObj = active as IText;
      props.fontSize = textObj.fontSize;
      props.fontFamily = textObj.fontFamily;
      props.text = textObj.text;
    }

    setSelectedProps(props);
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1280,
      height: 720,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    // Style active selection controls
    FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#3b82f6',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      borderScaleFactor: 1.5,
      padding: 4,
    });

    canvas.on('selection:created', updateSelectedProps);
    canvas.on('selection:updated', updateSelectedProps);
    canvas.on('selection:cleared', () => setSelectedProps(null));
    const normalizeTextScale = (target?: FabricObject) => {
      if (!target) return;
      if (target.type !== 'i-text' && target.type !== 'text') return;
      const textObj = target as IText;
      const sx = Math.abs(textObj.scaleX ?? 1);
      const sy = Math.abs(textObj.scaleY ?? 1);
      if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

      const baseFontSize = textObj.fontSize || 24;
      const nextFontSize = Math.max(1, Math.round(baseFontSize * ((sx + sy) / 2)));
      textObj.set({
        fontSize: nextFontSize,
        scaleX: 1,
        scaleY: 1,
      });
      textObj.setCoords();
    };

    canvas.on('object:modified', (opt: { target?: FabricObject }) => {
      normalizeTextScale(opt.target);
      updateSelectedProps();
      saveState();
    });
    canvas.on('object:added', () => {
      if (!isUndoRedo.current) saveState();
    });
    canvas.on('object:removed', () => {
      if (!isUndoRedo.current) saveState();
    });

    fabricRef.current = canvas;
    // Save initial state
    const initialJson = JSON.stringify(canvas.toJSON());
    importInitialStateRef.current = initialJson;
    undoStack.current = [initialJson];
    redoStack.current = [];
    updateHistoryState();
    setCanvasReady(true);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [updateSelectedProps, saveState, updateHistoryState]);

  // Handle tool changes for drawing mode
  useEffect(() => {
    if (!canvasReady) return;
    const applyToolState = (activeTool: Tool) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const isShapeTool =
        activeTool === 'rectangle' ||
        activeTool === 'circle' ||
        activeTool === 'triangle' ||
        activeTool === 'line';

      if (activeTool === 'pen') {
        canvas.isDrawingMode = true;
        const brush = new PencilBrush(canvas);
        brush.color = editorStore.getState().strokeColor;
        brush.width = editorStore.getState().strokeWidth;
        canvas.freeDrawingBrush = brush;
      } else {
        canvas.isDrawingMode = false;
      }

      if (activeTool === 'text') {
        canvas.defaultCursor = 'text';
      } else if (isShapeTool || activeTool === 'pen') {
        canvas.defaultCursor = 'crosshair';
      } else if (activeTool === 'image') {
        canvas.defaultCursor = 'copy';
      } else {
        canvas.defaultCursor = 'default';
      }

      if (activeTool === 'select') {
        canvas.selection = true;
        canvas.skipTargetFind = false;
        canvas.hoverCursor = 'move';
        canvas.moveCursor = 'move';
      } else {
        canvas.selection = false;
        canvas.skipTargetFind = true;
        canvas.hoverCursor = canvas.defaultCursor;
        canvas.moveCursor = canvas.defaultCursor;
      }

      canvas.requestRenderAll();
    };

    const unsub = editorStore.subscribe(() => {
      applyToolState(editorStore.getState().activeTool);
    });

    // Apply cursor/selection state for initial render.
    applyToolState(editorStore.getState().activeTool);
    return unsub;
  }, [canvasReady]);

  // Mouse event handlers for shape drawing
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !canvasReady) return;
    const ALIGN_MARGIN = 4;
    const GUIDE_COLOR = '#3b82f6';
    const GUIDE_WIDTH = 1;
    const GUIDE_DASH = 4;
    type BoundingRect = { left: number; top: number; width: number; height: number };
    type VerticalLineGuide = { x: number; y1: number; y2: number };
    type HorizontalLineGuide = { y: number; x1: number; x2: number };
    type RectLine = { x: number; y: number; x2: number; y2: number };
    type CollectItemLineProps = {
      target: FabricObject;
      list: RectLine[];
      aList: RectLine[];
      margin: number;
    };
    const verticalLines = new Set<string>();
    const horizontalLines = new Set<string>();

    const setGroupInteractive = (group: FabricObject, interactive: boolean) => {
      (group as any).subTargetCheck = true;
      (group as any).interactive = interactive;
      group.setCoords();
    };

    const enterGroupEdit = (group: FabricObject) => {
      if (editingGroupRef.current && editingGroupRef.current !== group) {
        setGroupInteractive(editingGroupRef.current, false);
      }
      editingGroupRef.current = group;
      setGroupInteractive(group, true);
    };

    const exitGroupEdit = () => {
      const group = editingGroupRef.current;
      if (!group) return;
      setGroupInteractive(group, false);
      editingGroupRef.current = null;
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
    };

    const isInsideGroup = (target: FabricObject | undefined, group: FabricObject | null) => {
      if (!target || !group) return false;
      if (target === group) return true;
      if ((target as any).group === group) return true;
      if (typeof (target as any).isDescendantOf === 'function') {
        return (target as any).isDescendantOf(group);
      }
      return false;
    };

    const clearGuides = (render = true) => {
      if (!verticalLines.size && !horizontalLines.size) return;
      verticalLines.clear();
      horizontalLines.clear();
      if (render) canvas.requestRenderAll();
    };

    const getSameLevelObjects = (target: FabricObject): FabricObject[] => {
      const parentGroup = (target as any).group as { _objects?: FabricObject[] } | undefined;
      if (parentGroup?._objects) {
        return parentGroup._objects.filter((obj) => obj !== target && obj.visible !== false);
      }
      return canvas
        .getObjects()
        .filter((obj) => obj !== target && !(obj as any).group && obj.visible !== false);
    };

    const getDistance = (a: number, b: number) => Math.abs(a - b);

    const setPositionDir = (target: FabricObject, pos: Point, dir: 'x' | 'y') => {
      const center = target.translateToCenterPoint(pos, 'center', 'center');
      const position = target.translateToOriginPoint(center, target.originX, target.originY);
      if (dir === 'x') target.setX(position.x);
      else target.setY(position.y);
    };

    const makeLineByRect = (rect: BoundingRect): RectLine[] => {
      const { left, top, width, height } = rect;
      const a = { x: left, y: top, x2: left + width, y2: top + height };
      const cx = left + width / 2;
      const cy = top + height / 2;
      const b = { x: cx, y: cy, x2: cx, y2: cy };
      const c = { x: left + width, x2: left, y: top + height, y2: top };
      return [a, b, c];
    };

    const getDistanceLine = (targetLine: RectLine, list: RectLine[], type: 'x' | 'y') => {
      let dis = Infinity;
      let index = -1;
      let dir = 1;
      for (let i = 0; i < list.length; i++) {
        const v = getDistance(targetLine[type], list[i][type]);
        if (dis > v) {
          index = i;
          dis = v;
          dir = targetLine[type] > list[i][type] ? 1 : -1;
        }
      }
      return { dis, index, dir };
    };

    const setPos = (props: {
      target: FabricObject;
      x: number;
      y: number;
      centerX: number;
      centerY: number;
      width: number;
      height: number;
      dir: 'x' | 'y';
    }) => {
      const { target, centerX, centerY, width, height, dir } = props;
      let { x, y } = props;
      x -= (centerX * width) / 2;
      y -= (centerY * height) / 2;
      setPositionDir(target, new Point(x, y), dir);
      target.setCoords();
    };

    const collectVerticalLine = (props: CollectItemLineProps): VerticalLineGuide[] => {
      const { target, list, aList, margin } = props;
      const arr = aList.map((line) => getDistanceLine(line, list, 'x'));
      const min = Math.min(...arr.map((item) => item.dis));
      if (min > margin) return [];

      const lines: VerticalLineGuide[] = [];
      const width = aList[0].x2 - aList[0].x;
      const height = aList[0].y2 - aList[0].y;
      let aligned = false;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (min === item.dis) {
          const line = list[item.index];
          const aLine = aList[item.index];
          const x = line.x;
          const y = aLine.y;
          const y1 = Math.min(line.y, line.y2, y, aLine.y2);
          const y2 = Math.max(line.y, line.y2, y, aLine.y2);
          lines.push({ x, y1, y2 });

          if (!aligned) {
            aligned = true;
            setPos({
              target,
              x,
              y,
              centerX: i - 1,
              centerY: item.index - 1,
              width,
              height,
              dir: 'x',
            });
            const dis = min * item.dir;
            aList.forEach((lineItem) => {
              lineItem.x -= dis;
            });
          }
        }
      }

      return lines;
    };

    const collectHorizontalLine = (props: CollectItemLineProps): HorizontalLineGuide[] => {
      const { target, list, aList, margin } = props;
      const arr = aList.map((line) => getDistanceLine(line, list, 'y'));
      const min = Math.min(...arr.map((item) => item.dis));
      if (min > margin) return [];

      const lines: HorizontalLineGuide[] = [];
      const width = aList[0].x2 - aList[0].x;
      const height = aList[0].y2 - aList[0].y;
      let aligned = false;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (min === item.dis) {
          const line = list[item.index];
          const aLine = aList[item.index];
          const y = line.y;
          const x = aLine.x;
          const x1 = Math.min(line.x, line.x2, x, aLine.x2);
          const x2 = Math.max(line.x, line.x2, x, aLine.x2);
          lines.push({ y, x1, x2 });

          if (!aligned) {
            aligned = true;
            setPos({
              target,
              x,
              y,
              centerX: item.index - 1,
              centerY: i - 1,
              width,
              height,
              dir: 'y',
            });
            const dis = min * item.dir;
            aList.forEach((lineItem) => {
              lineItem.y -= dis;
            });
          }
        }
      }

      return lines;
    };

    const collectLine = (activeObject: FabricObject, activeRect: BoundingRect, objectRect: BoundingRect) => {
      const list = makeLineByRect(objectRect);
      const aList = makeLineByRect(activeRect);
      const margin = ALIGN_MARGIN / (activeObject.canvas?.getZoom() ?? 1);
      const opts = { target: activeObject, list, aList, margin };
      return {
        vLines: collectVerticalLine(opts),
        hLines: collectHorizontalLine(opts),
      };
    };

    const drawLine = (origin: Point, targetPoint: Point) => {
      const ctx = canvas.getSelectionContext();
      const viewportTransform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = canvas.getZoom();
      ctx.save();
      ctx.transform(...viewportTransform);
      ctx.lineWidth = GUIDE_WIDTH / zoom;
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.setLineDash([GUIDE_DASH / zoom, GUIDE_DASH / zoom]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(targetPoint.x, targetPoint.y);
      ctx.stroke();
      ctx.restore();
    };

    const drawVerticalLine = (coords: VerticalLineGuide) => {
      drawLine(new Point(coords.x, coords.y1), new Point(coords.x, coords.y2));
    };

    const drawHorizontalLine = (coords: HorizontalLineGuide) => {
      drawLine(new Point(coords.x1, coords.y), new Point(coords.x2, coords.y));
    };

    const onObjectMoving = (opt: { target?: FabricObject }) => {
      const activeObject = opt.target;
      if (!activeObject || activeObject.type === 'activeSelection') {
        clearGuides(false);
        return;
      }

      activeObject.setCoords();
      verticalLines.clear();
      horizontalLines.clear();

      const siblings = getSameLevelObjects(activeObject);
      let activeRect = activeObject.getBoundingRect() as BoundingRect;

      for (const sibling of siblings) {
        const objectRect = sibling.getBoundingRect() as BoundingRect;
        const { vLines, hLines } = collectLine(activeObject, activeRect, objectRect);
        vLines.forEach((line) => verticalLines.add(JSON.stringify(line)));
        hLines.forEach((line) => horizontalLines.add(JSON.stringify(line)));
        if (vLines.length || hLines.length) {
          activeRect = activeObject.getBoundingRect() as BoundingRect;
        }
      }
    };

    const onBeforeRender = () => {
      canvas.clearContext(canvas.contextTop);
    };

    const onAfterRender = () => {
      if (!verticalLines.size && !horizontalLines.size) return;
      for (const raw of verticalLines) drawVerticalLine(JSON.parse(raw) as VerticalLineGuide);
      for (const raw of horizontalLines) drawHorizontalLine(JSON.parse(raw) as HorizontalLineGuide);
    };

    const onObjectModifiedForSnap = () => {
      clearGuides();
    };

    const onSelectionClearedForSnap = () => {
      clearGuides();
    };

    const onMouseDown = (opt: { e: MouseEvent; target?: FabricObject }) => {
      const state = editorStore.getState();
      const tool = state.activeTool;
      if (tool === 'select' || tool === 'pen') {
        if (tool === 'select' && editingGroupRef.current) {
          const target = opt.target as FabricObject | undefined;
          if (!isInsideGroup(target, editingGroupRef.current)) {
            exitGroupEdit();
          }
        }
        return;
      }
      if (tool === 'text') {
        const pointer = canvas.getScenePoint(opt.e);
        const text = new IText('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
          fill: state.fillColor,
          stroke: state.strokeColor,
          strokeWidth: 0,
          opacity: state.opacity,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        editorStore.setTool('select');
        return;
      }
      if (tool === 'image') return;

      isDrawingShape.current = true;
      const pointer = canvas.getScenePoint(opt.e);
      startPoint.current = { x: pointer.x, y: pointer.y };

      let shape: FabricObject | null = null;
      const commonProps = {
        left: pointer.x,
        top: pointer.y,
        fill: state.fillColor,
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
        opacity: state.opacity,
        strokeUniform: true,
      };

      switch (tool) {
        case 'rectangle':
          shape = new Rect({ ...commonProps, width: 1, height: 1, rx: 4, ry: 4 });
          break;
        case 'circle':
          shape = new Circle({ ...commonProps, radius: 1 });
          break;
        case 'triangle':
          shape = new Triangle({ ...commonProps, width: 1, height: 1 });
          break;
        case 'line':
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: state.strokeColor,
            strokeWidth: state.strokeWidth,
            opacity: state.opacity,
            strokeLineCap: 'round',
          });
          break;
      }

      if (shape) {
        canvas.add(shape);
        currentShape.current = shape;
        canvas.selection = false;
      }
    };

    const onMouseMove = (opt: { e: MouseEvent }) => {
      if (!isDrawingShape.current || !currentShape.current) return;
      const pointer = canvas.getScenePoint(opt.e);
      const sx = startPoint.current.x;
      const sy = startPoint.current.y;
      const tool = editorStore.getState().activeTool;

      if (tool === 'line') {
        (currentShape.current as Line).set({ x2: pointer.x, y2: pointer.y });
      } else {
        const left = Math.min(sx, pointer.x);
        const top = Math.min(sy, pointer.y);
        const w = Math.abs(pointer.x - sx);
        const h = Math.abs(pointer.y - sy);

        if (tool === 'circle') {
          const radius = Math.max(w, h) / 2;
          (currentShape.current as Circle).set({
            left: sx < pointer.x ? sx : sx - radius * 2,
            top: sy < pointer.y ? sy : sy - radius * 2,
            radius,
          });
        } else {
          currentShape.current.set({ left, top, width: w, height: h });
        }
      }
      currentShape.current.setCoords();
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      clearGuides();

      if (!isDrawingShape.current) return;
      isDrawingShape.current = false;
      const shape = currentShape.current;
      if (shape) {
        shape.setCoords();

        let shouldRemoveTiny = false;
        if (shape.type === 'line') {
          const line = shape as Line;
          const x1 = line.x1 ?? startPoint.current.x;
          const y1 = line.y1 ?? startPoint.current.y;
          const x2 = line.x2 ?? x1;
          const y2 = line.y2 ?? y1;
          const length = Math.hypot(x2 - x1, y2 - y1);
          shouldRemoveTiny = length < 3;
        } else {
          const bound = shape.getBoundingRect();
          shouldRemoveTiny = bound.width < 3 && bound.height < 3;
        }

        if (shouldRemoveTiny) {
          canvas.remove(shape);
        } else {
          canvas.setActiveObject(shape);
        }
      }
      currentShape.current = null;
      canvas.selection = true;
      canvas.skipTargetFind = false;
      editorStore.setTool('select');
    };

    const onDoubleClick = (opt: { target?: FabricObject; subTargets?: FabricObject[]; e?: MouseEvent }) => {
      const target = opt.target;
      const subTargets = opt.subTargets || [];
      const evt = opt.e;

      const isTextObject = (obj: FabricObject) => obj.type === 'i-text' || obj.type === 'text';
      const getGroupFromObject = (obj?: FabricObject) => {
        if (!obj) return null;
        if (obj.type === 'group') return obj;
        if ((obj as any).group) return (obj as any).group as FabricObject;
        return null;
      };

      // Prefer the innermost text object under the cursor (from subTargets)
      let textTarget = subTargets.find(isTextObject);
      if (!textTarget && target && isTextObject(target)) {
        textTarget = target;
      }

      if (textTarget) {
        const group = getGroupFromObject(textTarget);
        if (group) enterGroupEdit(group);

        // Convert plain Text to IText (preserve grouping)
        if (textTarget.type === 'text') {
          const textObj = textTarget as any;
          const parentGroup = (textObj as any).group as any | undefined;
          const indexInGroup = parentGroup ? parentGroup._objects.indexOf(textObj) : -1;

          if (parentGroup) {
            parentGroup.remove(textObj);
          } else {
            canvas.remove(textObj);
          }

          const options = textObj.toObject();
          const iText = new IText(textObj.text || '', options);

          if (parentGroup && indexInGroup >= 0) {
            parentGroup.insertAt(indexInGroup, iText);
          } else {
            canvas.add(iText);
          }

          textTarget = iText;
        }

        if (textTarget.type === 'i-text') {
          canvas.setActiveObject(textTarget);
          (textTarget as IText).enterEditing(evt);
          if (evt) {
            (textTarget as IText).setCursorByClick(evt);
            (textTarget as IText).renderCursorOrSelection();
            (textTarget as any).initDelayedCursor?.(true);
          }
          (textTarget as IText).once('editing:exited', () => {
            if ((textTarget as any).group) {
              canvas.setActiveObject((textTarget as any).group);
              canvas.requestRenderAll();
            }
          });
          canvas.requestRenderAll();
          saveState();
        }
        return;
      }

      // Double click on a group (or any object inside it) -> enter group edit mode
      const groupTarget = getGroupFromObject(target) || getGroupFromObject(subTargets[subTargets.length - 1]);
      if (groupTarget) {
        enterGroupEdit(groupTarget);
        const leafTarget = subTargets[0];
        if (leafTarget) {
          canvas.setActiveObject(leafTarget);
        } else {
          canvas.setActiveObject(groupTarget);
        }
        canvas.requestRenderAll();
      }
    };

    canvas.on('mouse:down', onMouseDown as any);
    canvas.on('mouse:move', onMouseMove as any);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('mouse:dblclick', onDoubleClick as any);
    canvas.on('object:moving', onObjectMoving as any);
    canvas.on('before:render', onBeforeRender as any);
    canvas.on('after:render', onAfterRender as any);
    canvas.on('object:modified', onObjectModifiedForSnap as any);
    canvas.on('selection:cleared', onSelectionClearedForSnap as any);

    return () => {
      canvas.off('mouse:down', onMouseDown as any);
      canvas.off('mouse:move', onMouseMove as any);
      canvas.off('mouse:up', onMouseUp);
      canvas.off('mouse:dblclick', onDoubleClick as any);
      canvas.off('object:moving', onObjectMoving as any);
      canvas.off('before:render', onBeforeRender as any);
      canvas.off('after:render', onAfterRender as any);
      canvas.off('object:modified', onObjectModifiedForSnap as any);
      canvas.off('selection:cleared', onSelectionClearedForSnap as any);
    };
  }, [canvasReady]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Don't handle shortcuts while editing text
      const active = canvas.getActiveObject();
      if (active && (active as IText).isEditing) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') {
        if (editingGroupRef.current) {
          const group = editingGroupRef.current;
          (group as any).subTargetCheck = true;
          (group as any).interactive = false;
          group.setCoords();
          editingGroupRef.current = null;
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          return;
        }
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        editorStore.setTool('select');
      }
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copySelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteClipboard();
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    if (active instanceof ActiveSelection) {
      active.forEachObject((obj) => canvas.remove(obj));
    } else {
      canvas.remove(active);
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setSelectedProps(null);
  }, []);

  const clipboardRef = useRef<FabricObject | null>(null);

  const copySelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: FabricObject) => {
      clipboardRef.current = cloned;
    });
  }, []);

  const pasteClipboard = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone().then((cloned: FabricObject) => {
      canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      if (cloned instanceof ActiveSelection) {
        cloned.canvas = canvas;
        cloned.forEachObject((obj) => canvas.add(obj));
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      clipboardRef.current!.set({
        left: (clipboardRef.current!.left || 0) + 20,
        top: (clipboardRef.current!.top || 0) + 20,
      });
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  }, []);

  const duplicateSelected = useCallback(() => {
    copySelected();
    setTimeout(() => pasteClipboard(), 50);
  }, [copySelected, pasteClipboard]);

  const selectAll = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    const objects = canvas.getObjects();
    if (objects.length === 0) return;
    const sel = new ActiveSelection(objects, { canvas });
    canvas.setActiveObject(sel);
    canvas.requestRenderAll();
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || undoStack.current.length <= 1) return;
    isUndoRedo.current = true;
    const currentState = undoStack.current.pop()!;
    redoStack.current.push(currentState);
    const prevState = undoStack.current[undoStack.current.length - 1];
    canvas.loadFromJSON(JSON.parse(prevState)).then(() => {
      canvas.requestRenderAll();
      isUndoRedo.current = false;
      updateHistoryState();
    });
  }, [updateHistoryState]);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || redoStack.current.length === 0) return;
    isUndoRedo.current = true;
    const nextState = redoStack.current.pop()!;
    undoStack.current.push(nextState);
    canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
      canvas.requestRenderAll();
      isUndoRedo.current = false;
      updateHistoryState();
    });
  }, [updateHistoryState]);

  const importSVG = useCallback((svgString: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    isImporting.current = true;
    undoStack.current = [];
    redoStack.current = [];
    updateHistoryState();

    // Define bgString here to be accessible in the async block
    let bgString: string | null = null;
    let bgLayerId: string | null = null;

    // Pre-process SVG to ensure width/height are set based on viewBox
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement;
    const viewBox = svgEl.getAttribute('viewBox');
    
    let width = parseFloat(svgEl.getAttribute('width') || '0');
    let height = parseFloat(svgEl.getAttribute('height') || '0');

    // Robust viewBox parsing
    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/);
      if (parts.length === 4) {
        const w = parseFloat(parts[2]);
        const h = parseFloat(parts[3]);
        
        if (!isNaN(w) && !isNaN(h)) {
          if (!width) {
            width = w;
            svgEl.setAttribute('width', w.toString());
          }
          if (!height) {
            height = h;
            svgEl.setAttribute('height', h.toString());
          }

          // Replace 100% dimensions on rect/image elements with actual pixels
          const shapes = svgEl.querySelectorAll('rect, image');
          shapes.forEach((el) => {
            if (el.getAttribute('width') === '100%') {
              el.setAttribute('width', width.toString());
            }
            if (el.getAttribute('height') === '100%') {
              el.setAttribute('height', height.toString());
            }
          });

          // FIX: Convert <tspan> multi-line text to simple \n separated text
          // This keeps the text as a single object (compatible with Groups) but fixes the "squeezed" rendering.
          const textEls = svgEl.querySelectorAll('text');
          textEls.forEach((textEl) => {
              const tspans = textEl.querySelectorAll('tspan');
              if (tspans.length > 0) {
                  // Check if this looks like a multi-line list (has dy)
                  const hasDy = Array.from(tspans).some(t => t.hasAttribute('dy'));
                  
                  if (hasDy) {
                      // Join content with placeholder to bypass SVG whitespace normalization
                      const lines: string[] = [];
                      tspans.forEach((t) => {
                          if (t.textContent) lines.push(t.textContent);
                      });
                      
                      // Use a placeholder that won't be stripped by XML parser
                      textEl.textContent = lines.join('__BR__');
                  }
              }
          });

          // Hybrid Approach: Extract background layer for native rendering
          // Look for a distinct background group/layer
          const bgElement = doc.getElementById('bg') || doc.querySelector('[id*="background"]');
          
          if (bgElement && bgElement.id) {
              bgLayerId = bgElement.id;
              try {
                  // Create a new lightweight SVG containing only defs and the bg layer
                  const bgDoc = doc.cloneNode(true) as Document;
                  const bgRoot = bgDoc.documentElement;
                  bgRoot.innerHTML = ''; // Clear children
                  
                  // Re-append defs (crucial for patterns/gradients)
                  const defs = doc.querySelector('defs');
                  if (defs) {
                      bgRoot.appendChild(bgDoc.importNode(defs, true));
                  }
                  
                  // Re-append the background element
                  bgRoot.appendChild(bgDoc.importNode(bgElement, true));
                  
                  // Ensure width/height are set on the background SVG for proper scaling
                  if (!bgRoot.getAttribute('width')) bgRoot.setAttribute('width', width.toString());
                  if (!bgRoot.getAttribute('height')) bgRoot.setAttribute('height', height.toString());

                  bgString = new XMLSerializer().serializeToString(bgDoc);
              } catch (e) {
                  console.warn('Failed to extract background layer:', e);
                  bgLayerId = null;
              }
          }

          svgString = new XMLSerializer().serializeToString(doc);
        }
      }
    }

    const getNearestGroupId = (el: Element): string | null => {
      let node: Element | null = el.parentElement;
      while (node) {
        if (node.tagName.toLowerCase() === 'g') {
          const id = node.getAttribute('id');
          if (id) return id;
        }
        node = node.parentElement;
      }
      return null;
    };

    import('fabric').then(async ({ loadSVGFromString, Color, FabricImage, classRegistry, Group }) => {
      let finalized = false;
      const finalizeImport = () => {
        const initialJson = JSON.stringify(canvas.toJSON());
        importInitialStateRef.current = initialJson;
        undoStack.current = [initialJson];
        redoStack.current = [];
        updateHistoryState();
        isImporting.current = false;
        finalized = true;
      };

      try {
        // Ensure <text> elements become editable IText
        classRegistry.setSVGClass(IText, 'text');

        // Rasterize background to PNG if extracted (Better for PPT export compatibility)
        let bgPngURL: string | null = null;
        if (bgString) {
          try {
            bgPngURL = await new Promise<string>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                // Use 2x scale for better quality
                const scale = 2;
                tempCanvas.width = width * scale;
                tempCanvas.height = height * scale;
                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                  ctx.scale(scale, scale);
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(tempCanvas.toDataURL('image/png'));
                } else {
                  resolve('');
                }
              };
              img.onerror = () => resolve('');
              // Handle unicode in SVG
              img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(bgString!)))}`;
            });
          } catch (e) {
            console.error('Background rasterization failed', e);
          }
        }

        const reviver = (el: Element, obj: FabricObject) => {
          const groupId = getNearestGroupId(el);
          if (groupId) {
            (obj as any).__svgGroupId = groupId;
          }
        };

        const result = await loadSVGFromString(svgString, reviver);
        const { objects, options } = result;

        // Use parsed width/height if available, otherwise fall back to options
        if (options && options.width && options.height) {
          width = parseInt(options.width.toString()) || width;
          height = parseInt(options.height.toString()) || height;
        }

        // Ensure we have valid dimensions
        if (!width || !height) {
          width = 1280;
          height = 720;
        }

        // Resize canvas to match SVG
        canvas.setDimensions({ width, height });

        // Clear existing content
        canvas.clear();
        canvas.backgroundColor = '#ffffff';

        // Set Rasterized Background Image (PNG)
        if (bgPngURL) {
          const img = await FabricImage.fromURL(bgPngURL, { crossOrigin: 'anonymous' });
          img.set({
            originX: 'left',
            originY: 'top',
            scaleX: width / (img.width || width),
            scaleY: height / (img.height || height),
          });
          canvas.backgroundImage = img;
        }

        // Helper: Process objects (fix patterns and text newlines)
        const processObjects = (objs: FabricObject[]) => {
          for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];

            // Recursively handle groups
            if (obj.type === 'group' && (obj as any)._objects) {
              processObjects((obj as any)._objects);
            }

            // Fix Text Newlines (restore from placeholder)
            if (obj.type === 'text' || obj.type === 'i-text') {
              const textObj = obj as IText;
              if (textObj.text && textObj.text.includes('__BR__')) {
                textObj.set('text', textObj.text.replaceAll('__BR__', '\n'));
              }
            }

            // Also apply the Black Rect Fix
            fixFailedPatterns(obj);
          }
        };

        // Helper to fix failed patterns (black rects) - Fallback for non-bg layers
        const fixFailedPatterns = (obj: FabricObject) => {
          // Handle groups recursively (already handled by processObjects, but kept for safety)
          if (obj.type === 'group' || (obj as any)._objects) {
            return; // processObjects handles recursion
          }

          if (obj.type === 'rect') {
            const fillVal = obj.fill;
            let isBlack = fillVal === 'rgb(0,0,0)' || fillVal === '#000000' || fillVal === 'black';

            // Double check with Color utility if string
            if (typeof fillVal === 'string' && !isBlack) {
              try {
                const c = new Color(fillVal);
                if (c.getSource()[0] === 0 && c.getSource()[1] === 0 && c.getSource()[2] === 0 && c.getAlpha() === 1) {
                  isBlack = true;
                }
              } catch (e) {}
            }

            // Check if full size (allow some tolerance)
            const scaledWidth = obj.width! * (obj.scaleX || 1);
            const scaledHeight = obj.height! * (obj.scaleY || 1);

            const isFullSize = scaledWidth >= (width - 20) && scaledHeight >= (height - 20);

            // If it's a full-screen black rect, it's likely a failed pattern overlay.
            if (isBlack && isFullSize) {
              obj.set('fill', 'transparent');
            }
          }
        };

        const validObjects = (objects ?? []).filter((obj): obj is FabricObject => obj !== null);

        // Process and Add objects
        if (validObjects.length > 0) {
          processObjects(validObjects); // Convert types and fix patterns before adding

          const shouldSkipBg = !!(bgLayerId && bgPngURL);
          const entries: Array<{ order: number; obj: FabricObject }> = [];
          const grouped = new Map<string, { order: number; objects: FabricObject[] }>();

          validObjects.forEach((obj, index) => {
            const groupId = (obj as any).__svgGroupId as string | undefined;
            if (shouldSkipBg && groupId === bgLayerId) {
              return;
            }

            if (groupId) {
              const bucket = grouped.get(groupId) || { order: index, objects: [] as FabricObject[] };
              bucket.objects.push(obj);
              if (index < bucket.order) bucket.order = index;
              grouped.set(groupId, bucket);
            } else {
              entries.push({ order: index, obj });
            }
          });

          grouped.forEach((bucket, groupId) => {
            if (bucket.objects.length === 1) {
              entries.push({ order: bucket.order, obj: bucket.objects[0] });
              return;
            }

            const group = new Group(bucket.objects, {
              subTargetCheck: true,
              interactive: false,
            });
            (group as any).__svgGroupId = groupId;
            entries.push({ order: bucket.order, obj: group });
          });

          entries
            .sort((a, b) => a.order - b.order)
            .forEach(({ obj }) => {
              canvas.add(obj);
            });
        }

        canvas.requestRenderAll();
        finalizeImport();
      } catch (e) {
        console.error('SVG import failed', e);
      } finally {
        if (!finalized) {
          isImporting.current = false;
          updateHistoryState();
        }
      }
    });
  }, [updateHistoryState]);

  const exportSVG = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return '';
    return canvas.toSVG();
  }, []);

  const exportPNG = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return '';
    return canvas.toDataURL({ format: 'png', multiplier: 2 });
  }, []);

  const addImage = useCallback((url: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale image to fit canvas
      const maxSize = 300;
      const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1), 1);
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width! / 2 - ((img.width || 0) * scale) / 2,
        top: canvas.height! / 2 - ((img.height || 0) * scale) / 2,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      editorStore.setTool('select');
    });
  }, []);

  const updateSelectedObject = useCallback((props: Partial<SelectedObjectProps>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    if (props.fill !== undefined) active.set('fill', props.fill);
    if (props.fillOpacity !== undefined) active.set('fillOpacity', props.fillOpacity);
    if (props.stroke !== undefined) active.set('stroke', props.stroke);
    if (props.strokeOpacity !== undefined) active.set('strokeOpacity', props.strokeOpacity);
    if (props.strokeWidth !== undefined) active.set('strokeWidth', props.strokeWidth);
    if (props.opacity !== undefined) active.set('opacity', props.opacity);
    if (props.angle !== undefined) {
      const center = active.getCenterPoint();
      active.set('angle', props.angle);
      active.setPositionByOrigin(center, 'center', 'center');
    }
    if (props.left !== undefined) active.set('left', props.left);
    if (props.top !== undefined) active.set('top', props.top);

    if (active.type === 'i-text' || active.type === 'text') {
      const textObj = active as IText;
      if (props.fontSize !== undefined) textObj.set('fontSize', props.fontSize);
      if (props.fontFamily !== undefined) textObj.set('fontFamily', props.fontFamily);
      if (props.text !== undefined) textObj.set('text', props.text);
    }

    active.setCoords();
    canvas.requestRenderAll();
    updateSelectedProps();
    saveState();
  }, [updateSelectedProps, saveState]);

  const resizeCanvas = useCallback((width: number, height: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width, height });
    canvas.requestRenderAll();
  }, []);

  const zoomTo = useCallback((zoom: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    editorStore.setZoom(zoom);
    canvas.requestRenderAll();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    saveState();
  }, [saveState]);

  const resetToImportInitialState = useCallback(() => {
    const canvas = fabricRef.current;
    const initialState = importInitialStateRef.current;
    if (!canvas || !initialState) return;

    isUndoRedo.current = true;
    canvas
      .loadFromJSON(JSON.parse(initialState))
      .then(() => {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        undoStack.current = [initialState];
        redoStack.current = [];
        setSelectedProps(null);
        updateHistoryState();
      })
      .finally(() => {
        isUndoRedo.current = false;
      });
  }, [updateHistoryState]);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringObjectForward(active);
      canvas.requestRenderAll();
      saveState();
    }
  }, [saveState]);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendObjectBackwards(active);
      canvas.requestRenderAll();
      saveState();
    }
  }, [saveState]);

  return {
    canvasRef,
    fabricRef,
    selectedProps,
    canvasReady,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    deleteSelected,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    selectAll,
    undo,
    redo,
    importSVG,
    exportSVG,
    exportPNG,
    addImage,
    updateSelectedObject,
    resizeCanvas,
    zoomTo,
    clearCanvas,
    resetToImportInitialState,
    bringForward,
    sendBackward,
  };
}
