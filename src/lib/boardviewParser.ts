/**
 * Boardview File Parser
 * Supports parsing standard Boardview file formats:
 * - .brd (Binary Boardview format)
 * - .fz (OpenBoardView Fritzing format)
 * - .json (Detailed PCB JSON format)
 */

export interface ParsedBoardPin {
  id: string;
  partId: string;
  pinNumber: string;
  netId: string;
  x: number;
  y: number;
  radius: number;
  shape?: 'circle' | 'rect';
  diodeValue?: string;
  isPin1?: boolean;
}

export interface ParsedBoardPart {
  id: string;
  name: string;
  packageType: 'BGA' | 'QFN' | '0402' | '0201' | 'COIL' | 'CONNECTOR' | 'TEST_POINT' | 'SOT' | 'OTHER';
  side: 'TOP' | 'BOTTOM';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  role: string;
  commonFault: string;
  pins: ParsedBoardPin[];
}

export interface ParsedBoardNet {
  id: string;
  name: string;
  voltage: string;
  diodeMode: string;
  color: string;
  description: string;
  isGround?: boolean;
  isPower?: boolean;
  safeInjectionVoltage?: string;
}

export interface ParsedBoardData {
  id: string;
  title: string;
  deviceModel: string;
  width: number;
  height: number;
  layersCount: number;
  nets: Record<string, ParsedBoardNet>;
  parts: ParsedBoardPart[];
  outlinePoints?: { x: number; y: number }[];
}

/**
 * Parse JSON Boardview format
 * Expected structure matches the BoardData interface
 */
export function parseJSONBoardview(content: string): ParsedBoardData {
  try {
    const data = JSON.parse(content);
    
    // Validate required fields
    if (!data.parts || !data.nets) {
      throw new Error('Invalid boardview JSON: missing parts or nets');
    }

    return {
      id: data.id || 'unknown',
      title: data.title || 'Unknown Board',
      deviceModel: data.deviceModel || 'Unknown Model',
      width: data.width || 1000,
      height: data.height || 1000,
      layersCount: data.layersCount || 2,
      nets: data.nets,
      parts: data.parts,
      outlinePoints: data.outlinePoints,
    };
  } catch (error) {
    throw new Error(`Failed to parse JSON boardview: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse OpenBoardView .fz format
 * This is a simplified parser for Fritzing-style boardview files
 */
export function parseFZBoardview(content: string): ParsedBoardData {
  const lines = content.split('\n');
  const parts: ParsedBoardPart[] = [];
  const nets: Record<string, ParsedBoardNet> = {};
  let currentSection: string | null = null;
  
  // Default nets
  nets['GND'] = {
    id: 'GND',
    name: 'GND',
    voltage: '0.00V',
    diodeMode: '0.000V',
    color: '#64748b',
    description: 'Ground',
    isGround: true,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect sections
    if (trimmed.startsWith('[PARTS]')) {
      currentSection = 'PARTS';
      continue;
    } else if (trimmed.startsWith('[NETS]')) {
      currentSection = 'NETS';
      continue;
    } else if (trimmed.startsWith('[BOARD]')) {
      currentSection = 'BOARD';
      continue;
    }

    if (!currentSection || trimmed.startsWith('#') || trimmed === '') continue;

    // Parse PARTS section
    if (currentSection === 'PARTS') {
      const partTokens = trimmed.split(',');
      if (partTokens.length >= 5) {
        const part: ParsedBoardPart = {
          id: partTokens[0].trim(),
          name: partTokens[1].trim(),
          packageType: determinePackageType(partTokens[2].trim()),
          side: partTokens[3].trim().toUpperCase() === 'BOTTOM' ? 'BOTTOM' : 'TOP',
          x: parseFloat(partTokens[4]) || 0,
          y: parseFloat(partTokens[5]) || 0,
          width: parseFloat(partTokens[6]) || 10,
          height: parseFloat(partTokens[7]) || 10,
          rotation: parseFloat(partTokens[8]) || 0,
          role: partTokens[9]?.trim() || 'Component',
          commonFault: partTokens[10]?.trim() || 'Unknown',
          pins: [],
        };
        
        // Parse pins if present
        if (partTokens.length > 11) {
          const pinData = partTokens[11].split(';');
          part.pins = pinData.map((pinStr, idx) => {
            const pinParts = pinStr.split(':');
            return {
              id: `${part.id}_pin_${idx}`,
              partId: part.id,
              pinNumber: pinParts[0] || `${idx + 1}`,
              netId: pinParts[1] || 'GND',
              x: parseFloat(pinParts[2]) || 0,
              y: parseFloat(pinParts[3]) || 0,
              radius: parseFloat(pinParts[4]) || 0.5,
              diodeValue: pinParts[5] || '0.000V',
              isPin1: idx === 0,
            };
          });
        }
        
        parts.push(part);
      }
    }

    // Parse NETS section
    if (currentSection === 'NETS') {
      const netParts = trimmed.split(',');
      if (netParts.length >= 3) {
        nets[netParts[0].trim()] = {
          id: netParts[0].trim(),
          name: netParts[1].trim(),
          voltage: netParts[2].trim(),
          diodeMode: netParts[3]?.trim() || '0.000V',
          color: netParts[4]?.trim() || '#64748b',
          description: netParts[5]?.trim() || '',
          isPower: netParts[6]?.trim() === 'power',
          isGround: netParts[6]?.trim() === 'ground',
        };
      }
    }
  }

  return {
    id: 'fz_board',
    title: 'OpenBoardView Board',
    deviceModel: 'FZ Format',
    width: 1000,
    height: 1000,
    layersCount: 2,
    nets,
    parts,
  };
}

/**
 * Parse binary .brd format
 * This is a simplified parser for binary boardview files
 * Note: Real BRD formats vary significantly between tools
 */
export function parseBRDFile(arrayBuffer: ArrayBuffer): ParsedBoardData {
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('utf-8');
  
  const parts: ParsedBoardPart[] = [];
  const nets: Record<string, ParsedBoardNet> = {};
  
  // Try to detect format and parse accordingly
  // This is a simplified implementation - real BRD parsers need format-specific logic
  
  // Default nets
  nets['GND'] = {
    id: 'GND',
    name: 'GND',
    voltage: '0.00V',
    diodeMode: '0.000V',
    color: '#64748b',
    description: 'Ground',
    isGround: true,
  };

  // Try to read header
  let offset = 0;
  try {
    // Read magic bytes or header
    const headerLength = Math.min(32, arrayBuffer.byteLength);
    const headerBytes = new Uint8Array(arrayBuffer, 0, headerLength);
    const header = decoder.decode(headerBytes);
    
    // Check if it's actually a text-based format
    if (header.includes('{') || header.includes('[')) {
      // Might be JSON in disguise
      const textContent = decoder.decode(new Uint8Array(arrayBuffer));
      return parseJSONBoardview(textContent);
    }
    
    // For true binary formats, we'd need format-specific parsing
    // This is a placeholder for demonstration
    console.warn('Binary BRD parsing is format-specific. Using fallback.');
    
  } catch (error) {
    console.error('Error parsing BRD header:', error);
  }

  return {
    id: 'brd_board',
    title: 'Binary Boardview',
    deviceModel: 'BRD Format',
    width: 1000,
    height: 1000,
    layersCount: 2,
    nets,
    parts,
  };
}

/**
 * Main parser function that auto-detects format
 */
export async function parseBoardviewFile(file: File): Promise<ParsedBoardData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'json') {
    const content = await file.text();
    return parseJSONBoardview(content);
  } else if (extension === 'fz') {
    const content = await file.text();
    return parseFZBoardview(content);
  } else if (extension === 'brd') {
    const arrayBuffer = await file.arrayBuffer();
    return parseBRDFile(arrayBuffer);
  } else {
    // Try to parse as JSON by default
    try {
      const content = await file.text();
      return parseJSONBoardview(content);
    } catch {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: .json, .fz, .brd`);
    }
  }
}

/**
 * Helper function to determine package type from string
 */
function determinePackageType(typeStr: string): ParsedBoardPart['packageType'] {
  const upper = typeStr.toUpperCase();
  
  if (upper.includes('BGA')) return 'BGA';
  if (upper.includes('QFN')) return 'QFN';
  if (upper.includes('0402')) return '0402';
  if (upper.includes('0201')) return '0201';
  if (upper.includes('COIL') || upper.includes('IND')) return 'COIL';
  if (upper.includes('CONN') || upper.includes('J')) return 'CONNECTOR';
  if (upper.includes('TP') || upper.includes('TEST')) return 'TEST_POINT';
  if (upper.includes('SOT')) return 'SOT';
  
  return 'OTHER';
}

/**
 * Convert parsed board data to render-ready format for PixiJS
 */
export function convertToRenderData(boardData: ParsedBoardData) {
  const renderData = {
    board: {
      width: boardData.width,
      height: boardData.height,
      outline: boardData.outlinePoints || [],
    },
    parts: boardData.parts.map(part => ({
      ...part,
      absoluteX: part.x,
      absoluteY: part.y,
    })),
    pins: boardData.parts.flatMap(part => 
      part.pins.map(pin => ({
        ...pin,
        absoluteX: part.x + pin.x,
        absoluteY: part.y + pin.y,
        netName: boardData.nets[pin.netId]?.name || pin.netId,
        netColor: boardData.nets[pin.netId]?.color || '#64748b',
      }))
    ),
    nets: boardData.nets,
  };

  return renderData;
}

/**
 * Convert existing BoardData format to ParsedBoardData format
 * This bridges the gap between the old mock data and the new parser format
 */
export function convertBoardDataToParsed(boardData: any): ParsedBoardData {
  return {
    id: boardData.id || 'unknown',
    title: boardData.title || 'Unknown Board',
    deviceModel: boardData.deviceModel || 'Unknown Model',
    width: boardData.width || 1000,
    height: boardData.height || 1000,
    layersCount: boardData.layersCount || 2,
    nets: boardData.nets || {},
    parts: boardData.parts || [],
    outlinePoints: boardData.outlinePoints,
  };
}
