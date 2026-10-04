'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Circle, Text, Line } from 'react-konva';
import { BoardData, BoardComponent, BoardPin } from './InteractiveBoardview';

interface KonvaBoardviewProps {
  boardData: BoardData;
  scale: number;
  position: { x: number; y: number };
  highlightedNet: string | undefined;
  onWheel: (e: any) => void;
  onDragStart: () => void;
  onDragEnd: (e: any) => void;
  containerWidth: number;
  containerHeight: number;
  getComponentColor: (component: BoardComponent) => string;
  getPinColor: (pin: BoardPin) => string;
}

export default function KonvaBoardview({
  boardData,
  scale,
  position,
  highlightedNet,
  onWheel,
  onDragStart,
  onDragEnd,
  containerWidth,
  containerHeight,
  getComponentColor,
  getPinColor,
}: KonvaBoardviewProps) {
  return (
    <Stage
      width={containerWidth}
      height={containerHeight}
      onWheel={onWheel}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ cursor: 'grab' }}
    >
      <Layer>
        {/* Board Background */}
        <Rect
          x={0}
          y={0}
          width={boardData?.width || 3000}
          height={boardData?.height || 1500}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={2}
        />

        {/* Grid Lines */}
        {[...Array(Math.ceil((boardData?.height || 1500) / 100))].map((_, i) => (
          <Line
            key={`h-${i}`}
            points={[0, i * 100, boardData?.width || 3000, i * 100]}
            stroke="#1e293b"
            strokeWidth={1}
          />
        ))}
        {[...Array(Math.ceil((boardData?.width || 3000) / 100))].map((_, i) => (
          <Line
            key={`v-${i}`}
            points={[i * 100, 0, i * 100, boardData?.height || 1500]}
            stroke="#1e293b"
            strokeWidth={1}
          />
        ))}

        {/* Components */}
        {boardData?.components.map((component) => (
          <Group key={component.id} x={component.x} y={component.y}>
            {/* Component Body */}
            <Rect
              x={0}
              y={0}
              width={component.width}
              height={component.height}
              fill={getComponentColor(component)}
              stroke={highlightedNet && component.pins.some((p) => p.net === highlightedNet) ? '#ef4444' : '#64748b'}
              strokeWidth={highlightedNet && component.pins.some((p) => p.net === highlightedNet) ? 3 : 2}
              cornerRadius={4}
            />

            {/* Component Label */}
            <Text
              x={component.width / 2}
              y={component.height / 2}
              text={component.name}
              fontSize={12}
              fill="white"
              align="center"
              verticalAlign="middle"
              fontStyle="bold"
            />

            {/* Pins */}
            {component.pins.map((pin) => (
              <Group key={pin.id}>
                {/* Pin Circle */}
                <Circle
                  x={pin.x - component.x}
                  y={pin.y - component.y}
                  radius={pin.type === 'via' ? 3 : 5}
                  fill={getPinColor(pin)}
                  stroke={pin.net === highlightedNet ? '#ef4444' : '#94a3b8'}
                  strokeWidth={pin.net === highlightedNet ? 2 : 1}
                />

                {/* Pin Label */}
                {pin.label && (
                  <Text
                    x={pin.x - component.x + 8}
                    y={pin.y - component.y - 6}
                    text={pin.label}
                    fontSize={8}
                    fill="#94a3b8"
                  />
                )}
              </Group>
            ))}
          </Group>
        ))}
      </Layer>
    </Stage>
  );
}
