'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Circle, Text, Line, Arrow, Tag, Label } from 'react-konva';
import type {
  BoardData,
  BoardPart,
  BoardPin,
  BoardNet,
  BoardSide,
} from './InteractiveBoardviewSimulator';

interface KonvaBoardviewProps {
  boardData: BoardData;
  scale: number;
  position: { x: number; y: number };
  selectedNetId: string;
  selectedPartId: string;
  selectedSide: BoardSide;
  showGrid: boolean;
  showFlightLines: boolean;
  showComponentLabels: boolean;
  showPinNumbers: boolean;
  onWheel: (e: any) => void;
  onDragStart: () => void;
  onDragEnd: (e: any) => void;
  containerWidth: number;
  containerHeight: number;
  onPartClick?: (part: BoardPart) => void;
  onPinHover?: (pin: BoardPin | null, part: BoardPart | null) => void;
}

export default function KonvaBoardview({
  boardData,
  scale,
  position,
  selectedNetId,
  selectedPartId,
  selectedSide,
  showGrid,
  showFlightLines,
  showComponentLabels,
  showPinNumbers,
  onWheel,
  onDragStart,
  onDragEnd,
  containerWidth,
  containerHeight,
  onPartClick,
  onPinHover,
}: KonvaBoardviewProps) {
  // Get active net
  const activeNet = boardData.nets[selectedNetId] || Object.values(boardData.nets)[0];

  // Filter parts by side
  const visibleParts = useMemo(() => {
    return boardData.parts.filter((p) => p.side === selectedSide);
  }, [boardData.parts, selectedSide]);

  // Get connected pins for flight lines
  const connectedPins = useMemo(() => {
    const list: { pin: BoardPin; part: BoardPart; worldX: number; worldY: number }[] = [];
    visibleParts.forEach((part) => {
      part.pins.forEach((pin) => {
        if (pin.netId === selectedNetId) {
          list.push({
            pin,
            part,
            worldX: part.x + pin.x,
            worldY: part.y + pin.y,
          });
        }
      });
    });
    return list;
  }, [visibleParts, selectedNetId]);

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
        {/* Board Background - Dark workshop theme */}
        <Rect
          x={0}
          y={0}
          width={boardData.width}
          height={boardData.height}
          fill="#0a0f1d"
        />

        {/* Grid Lines */}
        {showGrid && (
          <>
            {[...Array(Math.ceil(boardData.height / 20))].map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 20, boardData.width, i * 20]}
                stroke="rgba(51, 65, 85, 0.25)"
                strokeWidth={0.5}
              />
            ))}
            {[...Array(Math.ceil(boardData.width / 20))].map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 20, 0, i * 20, boardData.height]}
                stroke="rgba(51, 65, 85, 0.25)"
                strokeWidth={0.5}
              />
            ))}
          </>
        )}

        {/* PCB Board Outline */}
        <Rect
          x={10}
          y={10}
          width={boardData.width - 20}
          height={boardData.height - 20}
          fill="#06281e"
          stroke="#10b981"
          strokeWidth={1.5}
          cornerRadius={12}
          shadowColor="#10b981"
          shadowBlur={8}
        />

        {/* Flight Lines (Animated) */}
        {showFlightLines && connectedPins.length > 1 && activeNet && (
          <>
            {connectedPins.map((cp, i) => {
              if (i === connectedPins.length - 1) return null;
              const next = connectedPins[i + 1];
              const midX = (cp.worldX + next.worldX) / 2;
              const midY = (cp.worldY + next.worldY) / 2;
              const dx = next.worldX - cp.worldX;
              const dy = next.worldY - cp.worldY;
              const len = Math.hypot(dx, dy) || 1;
              const cpX = midX + (-dy / len) * (len * 0.22);
              const cpY = midY + (dx / len) * (len * 0.22);

              return (
                <Group key={`flight-${i}`}>
                  {/* Glow effect */}
                  <Line
                    points={[cp.worldX, cp.worldY, cpX, cpY, next.worldX, next.worldY]}
                    stroke={activeNet.color + '44'}
                    strokeWidth={5}
                    tension={0.5}
                    shadowColor={activeNet.color}
                    shadowBlur={18}
                  />
                  {/* Animated line */}
                  <Line
                    points={[cp.worldX, cp.worldY, cpX, cpY, next.worldX, next.worldY]}
                    stroke={activeNet.color}
                    strokeWidth={1.8}
                    tension={0.5}
                    dash={[5, 3]}
                    shadowColor={activeNet.color}
                    shadowBlur={12}
                  />
                  {/* Direction arrow */}
                  <Arrow
                    points={[midX, midY, midX + (dx / len) * 5, midY + (dy / len) * 5]}
                    pointerLength={4}
                    pointerWidth={4}
                    fill={activeNet.color}
                    stroke={activeNet.color}
                    shadowColor={activeNet.color}
                    shadowBlur={6}
                  />
                </Group>
              );
            })}
          </>
        )}

        {/* Components */}
        {visibleParts.map((part) => {
          const isSelected = part.id === selectedPartId;
          const partLeft = part.x - part.width / 2;
          const partTop = part.y - part.height / 2;

          return (
            <Group
              key={part.id}
              x={part.x}
              y={part.y}
              rotation={part.rotation || 0}
              onClick={() => onPartClick?.(part)}
              onTap={() => onPartClick?.(part)}
            >
              {/* Component Body */}
              <Rect
                x={-part.width / 2}
                y={-part.height / 2}
                width={part.width}
                height={part.height}
                fill={
                  part.packageType === 'BGA' || part.packageType === 'QFN'
                    ? isSelected ? '#1e293b' : '#0f172a'
                    : part.packageType === 'TEST_POINT'
                    ? isSelected ? '#fef08a' : '#eab308'
                    : isSelected ? '#475569' : '#1e293b'
                }
                stroke={
                  part.packageType === 'BGA' || part.packageType === 'QFN'
                    ? isSelected ? '#f59e0b' : '#334155'
                    : part.packageType === 'TEST_POINT'
                    ? '#ca8a04'
                    : isSelected ? '#f59e0b' : '#475569'
                }
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={2}
              />

              {/* Pin 1 Dot for ICs */}
              {(part.packageType === 'BGA' || part.packageType === 'QFN') && (
                <Circle
                  x={-part.width / 2 + 2}
                  y={-part.height / 2 + 2}
                  radius={0.8}
                  fill="#f8fafc"
                />
              )}

              {/* Component Label */}
              {showComponentLabels && scale >= 1.4 && (
                <Text
                  x={0}
                  y={part.height / 2 + 3}
                  text={part.name.split(' ')[0]}
                  fontSize={Math.max(2.2, 3.5 / scale)}
                  fill={isSelected ? '#f59e0b' : '#cbd5e1'}
                  fontStyle="bold"
                  fontFamily="monospace"
                  align="center"
                  verticalAlign="middle"
                />
              )}

              {/* Pins */}
              {part.pins.map((pin) => {
                const pinWorldX = part.x + pin.x;
                const pinWorldY = part.y + pin.y;
                const isConnectedToActiveNet = pin.netId === selectedNetId;
                const net = boardData.nets[pin.netId];
                const isGround = net?.isGround;

                return (
                  <Group
                    key={pin.id}
                    x={pin.x}
                    y={pin.y}
                    onMouseEnter={() => onPinHover?.(pin, part)}
                    onMouseLeave={() => onPinHover?.(null, null)}
                  >
                    {/* Pin Circle/Rect */}
                    {pin.shape === 'rect' ? (
                      <Rect
                        x={-pin.radius}
                        y={-pin.radius}
                        width={pin.radius * 2}
                        height={pin.radius * 2}
                        fill={
                          isConnectedToActiveNet
                            ? activeNet?.color
                            : isGround
                            ? '#475569'
                            : '#d97706'
                        }
                        stroke={
                          isConnectedToActiveNet
                            ? '#ffffff'
                            : isGround
                            ? '#1e293b'
                            : '#b45309'
                        }
                        strokeWidth={isConnectedToActiveNet ? 0.8 : 0.4}
                        shadowColor={isConnectedToActiveNet ? activeNet?.color : undefined}
                        shadowBlur={isConnectedToActiveNet ? 12 : 0}
                      />
                    ) : (
                      <Circle
                        radius={pin.radius}
                        fill={
                          isConnectedToActiveNet
                            ? activeNet?.color
                            : isGround
                            ? '#475569'
                            : '#d97706'
                        }
                        stroke={
                          isConnectedToActiveNet
                            ? '#ffffff'
                            : isGround
                            ? '#1e293b'
                            : '#b45309'
                        }
                        strokeWidth={isConnectedToActiveNet ? 0.8 : 0.4}
                        shadowColor={isConnectedToActiveNet ? activeNet?.color : undefined}
                        shadowBlur={isConnectedToActiveNet ? 12 : 0}
                      />
                    )}

                    {/* Pin 1 Indicator */}
                    {pin.isPin1 && (
                      <Circle radius={pin.radius * 0.4} fill="#ffffff" />
                    )}

                    {/* Pin Number */}
                    {showPinNumbers && (
                      <Text
                        x={pin.radius + 1}
                        y={-3}
                        text={pin.pinNumber}
                        fontSize={2}
                        fill="#94a3b8"
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
