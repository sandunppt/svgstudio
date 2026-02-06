export type Tool =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'text'
  | 'image'
  | 'pen';

export interface EditorState {
  activeTool: Tool;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  opacity: number;
  zoom: number;
}

export interface SelectedObjectProps {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  fill: string;
  fillOpacity?: number;
  stroke: string;
  strokeOpacity?: number;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  text?: string;
  rx?: number;
  ry?: number;
  radius?: number;
  svgString?: string;
}
