'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Application, Graphics, FederatedPointerEvent, Text as PixiText } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import {
  ParsedBoardData,
  ParsedBoardPart,
  ParsedBoardPin,
  convertToRenderData,
} from '@/lib/boardviewParser';

// ==========================================
// Main PixiJS Boardview Component
// ==========================================

interface PixiBoardviewProps {
  boardData: ParsedBoardData | null;
  highlightedNetId?: string | null;
  selectedSide?: 'TOP' | 'BOTTOM';
  showGrid?: boolean;
  showLabels?: boolean;
  showPinNumbers?: boolean;
  showDiodeOverlay?: boolean;
  showCoordinates?: boolean;
  showMeasurements?: boolean;
  onPartClick?: (part: ParsedBoardPart) => void;
  onPinClick?: (pin: ParsedBoardPin) => void;
  width?: number;
  height?: number;
}

export default function PixiBoardview({
  boardData,
  highlightedNetId = null,
  selectedSide = 'TOP',
  showGrid = true,
  showLabels = true,
  showPinNumbers = false,
  showDiodeOverlay = false,
  showCoordinates = false,
  showMeasurements = false,
  onPartClick,
  onPinClick,
  width = 800,
  height = 600,
}: PixiBoardviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const [renderData, setRenderData] = useState<any>(null);
  const [selectedPart, setSelectedPart] = useState<ParsedBoardPart | null>(null);

  // Convert board data to render format when it changes
  useEffect(() => {
    if (boardData) {
      console.log('PixiBoardview: Processing board data', boardData.id, boardData.parts.length, 'parts');
      const data = convertToRenderData(boardData);
      console.log('PixiBoardview: Converted render data', data.parts.length, 'parts', data.pins.length, 'pins');
      console.log('PixiBoardview: Parts sides:', data.parts.map((p: any) => `${p.id}:${p.side}`));
      // Filter parts by selected side
      const filteredParts = data.parts.filter((part: ParsedBoardPart) => part.side === selectedSide);
      const filteredPins = data.pins.filter((pin: any) => {
        const part = filteredParts.find((p: ParsedBoardPart) => p.id === pin.partId);
        return part !== undefined;
      });
      console.log('PixiBoardview: Filtered to', filteredParts.length, 'parts', filteredPins.length, 'pins for side', selectedSide);
      console.log('PixiBoardview: Filtered parts:', filteredParts.map((p: any) => p.id));
      setRenderData({
        ...data,
        parts: filteredParts,
        pins: filteredPins,
      });
    }
  }, [boardData, selectedSide]);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      view: canvasRef.current,
      width,
      height,
      backgroundColor: 0x0a0f1d, // Match Konva background
      antialias: true, // Enable for better quality
      resolution: window.devicePixelRatio || 2, // High resolution for sharp rendering
      autoDensity: true, // Enable for crisp rendering on high-DPI displays
      backgroundAlpha: 1,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    appRef.current = app;

    // Create viewport
    const viewport = new Viewport({
      screenWidth: width,
      screenHeight: height,
      worldWidth: (boardData?.width || 2000) * 2, // Larger world to allow panning
      worldHeight: (boardData?.height || 2000) * 2,
      events: app.renderer.events,
    });

    viewport
      .drag({ mouseButtons: 'left' })
      .pinch()
      .wheel()
      .decelerate()
      .clampZoom({
        minWidth: 50,
        maxWidth: 10000,
        minHeight: 50,
        maxHeight: 10000,
      });

    app.stage.addChild(viewport);
    viewportRef.current = viewport;

    return () => {
      app.destroy(true, { children: true });
    };
  }, [width, height, boardData?.width, boardData?.height]);

  // Fit board to view when board data changes
  useEffect(() => {
    if (viewportRef.current && boardData) {
      const viewport = viewportRef.current;
      // Center the board in the viewport
      viewport.moveCenter(boardData.width / 2, boardData.height / 2);
      // Set zoom to fit with better scale - much higher zoom for full board visibility
      const scaleX = width / boardData.width;
      const scaleY = height / boardData.height;
      const zoom = Math.min(scaleX, scaleY) * 5.0; // Increased significantly to show full board clearly
      viewport.setZoom(zoom);
      console.log('PixiBoardview: Set zoom to', zoom, 'for board', boardData.width, 'x', boardData.height);
      console.log('PixiBoardview: Viewport size', width, 'x', height);
    }
  }, [boardData, width, height]);

  // Render board content
  useEffect(() => {
    if (!viewportRef.current || !renderData) return;

    const viewport = viewportRef.current;

    // Clear existing content with proper cleanup
    while (viewport.children.length > 0) {
      const child = viewport.children[0];
      if (child.destroy) {
        child.destroy({ children: true });
      }
      viewport.removeChild(child);
    }

    // Draw board background
    const boardGraphics = new Graphics();
    boardGraphics.beginFill(0x0a0f1d, 1); // Dark background matching Konva
    boardGraphics.drawRect(0, 0, renderData.board.width, renderData.board.height);
    boardGraphics.endFill();

    // Draw PCB Board Outline (green glow)
    boardGraphics.lineStyle(1.5, 0x10b981, 1);
    boardGraphics.beginFill(0x06281e, 1);
    if (renderData.board.outline && renderData.board.outline.length > 0) {
      const polygonPoints = renderData.board.outline.flatMap((p: { x: number; y: number }) => [p.x, p.y]);
      boardGraphics.drawPolygon(polygonPoints);
    } else {
      // Default rectangular board with margin
      boardGraphics.drawRect(10, 10, renderData.board.width - 20, renderData.board.height - 20);
    }
    boardGraphics.endFill();
    viewport.addChild(boardGraphics);

    // Draw Grid Lines
    if (showGrid && renderData.board.width > 0 && renderData.board.height > 0) {
      const gridGraphics = new Graphics();
      gridGraphics.lineStyle(0.8, 0x334155, 0.35);

      const gridSize = 20;
      for (let x = 0; x <= renderData.board.width; x += gridSize) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, renderData.board.height);
      }
      for (let y = 0; y <= renderData.board.height; y += gridSize) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(renderData.board.width, y);
      }
      viewport.addChild(gridGraphics);

      // Coordinate Labels
      if (showCoordinates) {
        for (let x = 0; x <= renderData.board.width; x += 100) {
          const coordText = new PixiText(`${x}`, {
            fontSize: 9,
            fill: 0x94a3b8,
            fontFamily: 'Arial, sans-serif',
          });
          coordText.x = x;
          coordText.y = 5;
          coordText.alpha = 0.6;
          viewport.addChild(coordText);
        }
        for (let y = 0; y <= renderData.board.height; y += 100) {
          const coordText = new PixiText(`${y}`, {
            fontSize: 9,
            fill: 0x94a3b8,
            fontFamily: 'Arial, sans-serif',
          });
          coordText.x = 5;
          coordText.y = y;
          coordText.alpha = 0.6;
          viewport.addChild(coordText);
        }
      }
    }

    // Draw Flight Lines (Animated) if highlighted net
    if (highlightedNetId && renderData.pins.length > 0) {
      const connectedPins = renderData.pins.filter((p: any) => p.netId === highlightedNetId);
      if (connectedPins.length > 1) {
        const flightGraphics = new Graphics();
        const netColor = parseInt(
          renderData.nets[highlightedNetId]?.color?.replace('#', '') || '4a9eff',
          16
        ) || 0x4a9eff;

        // Draw glow effect (stronger for better visibility)
        flightGraphics.lineStyle(6, netColor, 0.35);
        for (let i = 0; i < connectedPins.length - 1; i++) {
          const p1 = connectedPins[i];
          const p2 = connectedPins[i + 1];
          flightGraphics.moveTo(p1.absoluteX, p1.absoluteY);
          flightGraphics.lineTo(p2.absoluteX, p2.absoluteY);
        }
        viewport.addChild(flightGraphics);

        // Draw main line (thicker for better visibility)
        const animatedLineGraphics = new Graphics();
        animatedLineGraphics.lineStyle(2.5, netColor, 1);
        for (let i = 0; i < connectedPins.length - 1; i++) {
          const p1 = connectedPins[i];
          const p2 = connectedPins[i + 1];
          animatedLineGraphics.moveTo(p1.absoluteX, p1.absoluteY);
          animatedLineGraphics.lineTo(p2.absoluteX, p2.absoluteY);
        }
        viewport.addChild(animatedLineGraphics);
      }
    }

    // Draw parts (no limit - render all parts with improved visibility)
    const partsToRender = renderData.parts;
    console.log('Rendering', partsToRender.length, 'parts in PixiJS');
    partsToRender.forEach((part: ParsedBoardPart) => {
      const partGraphics = new Graphics();
      const isSelected = selectedPart?.id === part.id;
      const isDimmed = highlightedNetId !== null;
      const alpha = isDimmed ? 0.25 : 0.8;
      const color = isSelected ? 0xff6b6b : 0x1e3a5f; // Dark blue for components

      // Glow effect for selected part
      if (isSelected) {
        partGraphics.beginFill(color, 0.2);
        partGraphics.drawCircle(part.x, part.y, Math.max(part.width, part.height) * 0.7);
        partGraphics.endFill();
      }

      partGraphics.beginFill(color, alpha);
      partGraphics.lineStyle(1.5, 0x10b981, 1); // Green border like Konva
      partGraphics.drawRect(
        part.x - part.width / 2,
        part.y - part.height / 2,
        part.width,
        part.height
      );
      partGraphics.endFill();

      // Pin 1 indicator
      if (part.pins.some((p: ParsedBoardPin) => p.isPin1)) {
        partGraphics.beginFill(0xffffff, 1);
        partGraphics.drawCircle(
          part.x - part.width / 2 + 2,
          part.y - part.height / 2 + 2,
          1.5
        );
        partGraphics.endFill();
      }

      partGraphics.eventMode = 'static';
      partGraphics.cursor = 'pointer';
      partGraphics.on('pointerdown', () => {
        console.log('Part clicked in Pixi:', part);
        setSelectedPart(part);
        onPartClick?.(part);
      });

      viewport.addChild(partGraphics);

      // Component Label
      if (showLabels && part.name) {
        const labelText = new PixiText(part.name.split(' ')[0], {
          fontSize: 13,
          fill: isSelected ? 0xf59e0b : 0xcbd5e1,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: 0.5,
        });
        labelText.anchor.set(0.5, 0);
        labelText.x = part.x;
        labelText.y = part.y + part.height / 2 + 6;
        viewport.addChild(labelText);
      }

      // Component Dimensions
      if (showMeasurements) {
        const dimText = new PixiText(`${part.width}x${part.height}`, {
          fontSize: 11,
          fill: 0x94a3b8,
          fontFamily: 'Arial, sans-serif',
        });
        dimText.anchor.set(0.5, 0);
        dimText.x = part.x;
        dimText.y = part.y + part.height / 2 + 14;
        dimText.alpha = 0.8;
        viewport.addChild(dimText);
      }
    });

    // Draw pins (render all pins with improved visibility)
    renderData.pins.forEach((pin: ParsedBoardPin & { absoluteX: number; absoluteY: number; netColor: string }) => {
        const pinGraphics = new Graphics();
        const isHighlighted = highlightedNetId === pin.netId;
        const isDimmed = highlightedNetId !== null && highlightedNetId !== pin.netId;
        const alpha = isDimmed ? 0.15 : isHighlighted ? 1 : 0.7;
        const color = isHighlighted ? 0xff0000 : parseInt(pin.netColor.replace('#', ''), 16) || 0x4a9eff;

        // Glow effect for highlighted pins
        if (isHighlighted) {
          pinGraphics.beginFill(color, 0.3);
          pinGraphics.drawCircle(pin.absoluteX, pin.absoluteY, pin.radius * 2);
          pinGraphics.endFill();
        }

        pinGraphics.beginFill(color, alpha);
        pinGraphics.lineStyle(isHighlighted ? 2.5 : 1.5, color, alpha);

        if (pin.shape === 'rect') {
          pinGraphics.drawRect(pin.absoluteX - pin.radius, pin.absoluteY - pin.radius, pin.radius * 2, pin.radius * 2);
        } else {
          pinGraphics.drawCircle(pin.absoluteX, pin.absoluteY, pin.radius);
        }
        pinGraphics.endFill();

        // Pin 1 indicator
        if (pin.isPin1) {
          pinGraphics.beginFill(0xffffff, 1);
          pinGraphics.drawCircle(pin.absoluteX, pin.absoluteY, pin.radius * 0.5);
          pinGraphics.endFill();
        }

        // Pin Number
        if (showPinNumbers) {
          const pinNumText = new PixiText(pin.pinNumber, {
            fontSize: 8,
            fill: 0x94a3b8,
            fontFamily: 'monospace',
          });
          pinNumText.x = pin.absoluteX + pin.radius + 2;
          pinNumText.y = pin.absoluteY - 4;
          viewport.addChild(pinNumText);
        }

        // Diode Value Overlay
        if (showDiodeOverlay && pin.diodeValue && pin.diodeValue !== '0.000V') {
          const diodeText = new PixiText(pin.diodeValue.replace('V', ''), {
            fontSize: 9,
            fill: isHighlighted ? 0xffffff : 0xfef08a,
            fontWeight: 'bold',
            fontFamily: 'monospace',
          });
          diodeText.anchor.set(0.5, 0);
          diodeText.x = pin.absoluteX;
          diodeText.y = pin.absoluteY - pin.radius - 3;
          viewport.addChild(diodeText);
        }

        pinGraphics.eventMode = 'static';
        pinGraphics.cursor = 'pointer';
        pinGraphics.on('pointerdown', () => {
          onPinClick?.(pin);
        });

        viewport.addChild(pinGraphics);
      });

  }, [renderData, highlightedNetId, selectedPart, showGrid, showLabels, showPinNumbers, showDiodeOverlay, showCoordinates, showMeasurements]);

  const handlePartClick = useCallback((part: ParsedBoardPart) => {
    setSelectedPart(part);
    onPartClick?.(part);
  }, [onPartClick]);

  const handlePinClick = useCallback((pin: ParsedBoardPin) => {
    onPinClick?.(pin);
  }, [onPinClick]);

  if (!renderData || !boardData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No board data loaded</p>
          <p className="text-sm">Upload a .brd, .fz, or .json file to view the board</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

      {/* Info Overlay */}
      {selectedPart && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">{selectedPart.name}</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-400">Type:</span> {selectedPart.packageType}</p>
            <p><span className="text-gray-400">Side:</span> {selectedPart.side}</p>
            <p><span className="text-gray-400">Pins:</span> {selectedPart.pins.length}</p>
            <p><span className="text-gray-400">Role:</span> {selectedPart.role}</p>
            <p className="text-yellow-400 mt-2">{selectedPart.commonFault}</p>
          </div>
          <button
            onClick={() => setSelectedPart(null)}
            className="mt-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Close
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm">
        <p>🖱️ Drag to pan • Scroll to zoom • Click parts/pins for details</p>
      </div>
    </div>
  );
}
