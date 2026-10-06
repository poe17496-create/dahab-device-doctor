/**
 * Schematic Types - أنواع بيانات المخططات الهندسية
 * Schematic Diagrams Type Definitions
 */

export interface SchematicComponent {
  id: string;
  name: string;
  type: 'IC' | 'Capacitor' | 'Resistor' | 'Inductor' | 'Connector' | 'Diode' | 'Transistor' | 'Other';
  partNumber?: string;
  description?: string;
  x: number; // Percentage position (0-100)
  y: number; // Percentage position (0-100)
  connectedNets?: string[];
}

export interface SchematicNet {
  id: string;
  name: string;
  type: 'power' | 'signal' | 'ground' | 'data';
  voltage?: number;
  points: Array<{ x: number; y: number }>; // Percentage coordinates
  color?: string;
  description?: string;
  components?: string[]; // Component IDs
}

export interface Schematic {
  id: string;
  schematic_name: string;
  schematic_url: string;
  device_model?: string;
  board_type?: string;
  description?: string;
  components: SchematicComponent[];
  nets: SchematicNet[];
  created_at: string;
  updated_at: string;
}

export interface BoardSchematicMapping {
  id: string;
  board_id: string;
  schematic_id: string;
  alignment_data: AlignmentData;
  confidence_score: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlignmentData {
  offsetX: number; // Percentage offset X
  offsetY: number; // Percentage offset Y
  scaleX: number; // Scale factor
  scaleY: number; // Scale factor
  rotation: number; // Rotation in degrees
  referencePoints?: Array<{
    board: { x: number; y: number };
    schematic: { x: number; y: number };
  }>;
}

export interface PathTraceStep {
  stepNumber: number;
  point: { x: number; y: number };
  component?: string;
  description: string;
  completed: boolean;
}

export interface PathTraceResult {
  netId: string;
  netName: string;
  steps: PathTraceStep[];
  totalSteps: number;
  currentStep: number;
  confidence: number;
  isComplete: boolean;
}

export interface SchematicUploadRequest {
  schematicName: string;
  schematicUrl: string;
  deviceModel?: string;
  boardType?: string;
  description?: string;
  components?: SchematicComponent[];
  nets?: SchematicNet[];
}

export interface SchematicUploadResponse {
  success: boolean;
  schematic?: Schematic;
  error?: string;
}

export interface SchematicFetchResponse {
  success: boolean;
  schematic?: Schematic;
  error?: string;
}

export interface AIPathDetectionRequest {
  schematicUrl: string;
  boardImageUrl?: string;
  netName?: string;
}

export interface AIPathDetectionResponse {
  success: boolean;
  detectedPaths?: Array<{
    netName: string;
    points: Array<{ x: number; y: number }>;
    confidence: number;
  }>;
  alignmentData?: AlignmentData;
  error?: string;
}
