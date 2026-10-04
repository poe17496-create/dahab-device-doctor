/**
 * Sample Board Data Generator
 * Generates realistic board data for testing the PixiJS Boardview viewer
 */

import { ParsedBoardData } from './boardviewParser';

export function generateSampleBoardData(): ParsedBoardData {
  const nets: Record<string, any> = {
    'GND': {
      id: 'GND',
      name: 'GND (Ground)',
      voltage: '0.00V',
      diodeMode: '0.000V',
      color: '#64748b',
      description: 'System ground',
      isGround: true,
    },
    'PP_VDD_MAIN': {
      id: 'PP_VDD_MAIN',
      name: 'PP_VDD_MAIN',
      voltage: '3.7V - 4.2V',
      diodeMode: '0.380V - 0.420V',
      color: '#f59e0b',
      description: 'Main power rail',
      isPower: true,
      safeInjectionVoltage: '3.8V - 4.0V',
    },
    'PP_CPU_VCORE': {
      id: 'PP_CPU_VCORE',
      name: 'PP_CPU_VCORE',
      voltage: '0.85V',
      diodeMode: '0.018V - 0.045V',
      color: '#38bdf8',
      description: 'CPU core voltage',
      isPower: true,
      safeInjectionVoltage: '0.8V',
    },
    'PP_1V8_ALWAYS': {
      id: 'PP_1V8_ALWAYS',
      name: 'PP1V8_ALWAYS',
      voltage: '1.80V',
      diodeMode: '0.340V - 0.390V',
      color: '#a855f7',
      description: 'Always-on 1.8V rail',
      isPower: true,
      safeInjectionVoltage: '1.8V',
    },
    'I2C_SDA': {
      id: 'I2C_SDA',
      name: 'I2C_SDA',
      voltage: '1.80V Logic',
      diodeMode: '0.410V - 0.460V',
      color: '#ec4899',
      description: 'I2C data line',
    },
    'I2C_SCL': {
      id: 'I2C_SCL',
      name: 'I2C_SCL',
      voltage: '1.80V Logic',
      diodeMode: '0.410V - 0.460V',
      color: '#ec4899',
      description: 'I2C clock line',
    },
  };

  const parts: any[] = [];

  // Generate CPU (BGA with many pins)
  const cpuPins: any[] = [];
  const cpuRows = 20;
  const cpuCols = 20;
  for (let r = 0; r < cpuRows; r++) {
    for (let c = 0; c < cpuCols; c++) {
      let netId = 'GND';
      let diode = '0.000V';
      
      // Create realistic power distribution
      if (r >= 4 && r <= 7 && c >= 4 && c <= 7) {
        netId = 'PP_CPU_VCORE';
        diode = '0.025V';
      } else if (r >= 12 && r <= 15 && c >= 12 && c <= 15) {
        netId = 'PP_CPU_VCORE';
        diode = '0.025V';
      } else if (r === 0 || c === 0 || r === cpuRows - 1 || c === cpuCols - 1) {
        netId = 'PP_1V8_ALWAYS';
        diode = '0.360V';
      } else if ((r === 1 && c === 1) || (r === 1 && c === cpuCols - 2)) {
        netId = 'I2C_SDA';
        diode = '0.430V';
      } else if ((r === 1 && c === 2) || (r === 1 && c === cpuCols - 3)) {
        netId = 'I2C_SCL';
        diode = '0.430V';
      }

      cpuPins.push({
        id: `cpu_pin_${r}_${c}`,
        partId: 'U1000_CPU',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - (cpuCols - 1) / 2) * 1.5,
        y: (r - (cpuRows - 1) / 2) * 1.5,
        radius: 0.4,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U1000_CPU',
    name: 'Main CPU (U1000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 500,
    y: 400,
    width: 40,
    height: 40,
    rotation: 0,
    role: 'Main processor',
    commonFault: 'Short on VCORE rails',
    pins: cpuPins,
  });

  // Generate PMIC
  const pmicPins: any[] = [];
  const pmicRows = 10;
  const pmicCols = 10;
  for (let r = 0; r < pmicRows; r++) {
    for (let c = 0; c < pmicCols; c++) {
      let netId = 'GND';
      let diode = '0.000V';
      
      if (r < 2 && c < 2) {
        netId = 'PP_VDD_MAIN';
        diode = '0.395V';
      } else if (r >= 6 && c < 3) {
        netId = 'PP_CPU_VCORE';
        diode = '0.028V';
      } else if (r >= 6 && c >= 6) {
        netId = 'PP_1V8_ALWAYS';
        diode = '0.365V';
      }

      pmicPins.push({
        id: `pmic_pin_${r}_${c}`,
        partId: 'U2000_PMIC',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - (pmicCols - 1) / 2) * 1.8,
        y: (r - (pmicRows - 1) / 2) * 1.8,
        radius: 0.5,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U2000_PMIC',
    name: 'Power Management IC (U2000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 300,
    y: 400,
    width: 25,
    height: 25,
    rotation: 0,
    role: 'Power management',
    commonFault: 'Overheating, short circuits',
    pins: pmicPins,
  });

  // Generate capacitors on VDD_MAIN
  for (let i = 0; i < 50; i++) {
    const capX = 250 + (i % 10) * 20;
    const capY = 250 + Math.floor(i / 10) * 20;
    
    parts.push({
      id: `C${2000 + i}`,
      name: `Capacitor C${2000 + i}`,
      packageType: '0402',
      side: 'TOP',
      x: capX,
      y: capY,
      width: 3,
      height: 1.5,
      rotation: 0,
      role: 'Decoupling capacitor',
      commonFault: 'Short circuit',
      pins: [
        {
          id: `C${2000 + i}_p1`,
          partId: `C${2000 + i}`,
          pinNumber: '1',
          netId: 'PP_VDD_MAIN',
          x: -1,
          y: 0,
          radius: 0.3,
          shape: 'rect',
          diodeValue: '0.395V',
        },
        {
          id: `C${2000 + i}_p2`,
          partId: `C${2000 + i}`,
          pinNumber: '2',
          netId: 'GND',
          x: 1,
          y: 0,
          radius: 0.3,
          shape: 'rect',
          diodeValue: '0.000V',
        },
      ],
    });
  }

  // Generate test points
  const testPoints = [
    { id: 'TP_VDD_MAIN', name: 'TP_VDD_MAIN', x: 400, y: 300, net: 'PP_VDD_MAIN' },
    { id: 'TP_CPU_VCORE', name: 'TP_CPU_VCORE', x: 550, y: 350, net: 'PP_CPU_VCORE' },
    { id: 'TP_1V8', name: 'TP_1V8', x: 300, y: 300, net: 'PP_1V8_ALWAYS' },
    { id: 'TP_GND', name: 'TP_GND', x: 350, y: 500, net: 'GND' },
  ];

  testPoints.forEach((tp) => {
    parts.push({
      id: tp.id,
      name: tp.name,
      packageType: 'TEST_POINT',
      side: 'TOP',
      x: tp.x,
      y: tp.y,
      width: 2,
      height: 2,
      rotation: 0,
      role: 'Test point',
      commonFault: 'Corrosion',
      pins: [
        {
          id: `${tp.id}_pin`,
          partId: tp.id,
          pinNumber: 'TP',
          netId: tp.net,
          x: 0,
          y: 0,
          radius: 0.8,
          diodeValue: tp.net === 'GND' ? '0.000V' : '0.400V',
        },
      ],
    });
  });

  // Generate connectors
  parts.push({
    id: 'J3000_USB',
    name: 'USB Connector (J3000)',
    packageType: 'CONNECTOR',
    side: 'TOP',
    x: 100,
    y: 400,
    width: 15,
    height: 30,
    rotation: 0,
    role: 'USB port',
    commonFault: 'Damaged pins',
    pins: [
      { id: 'usb_1', partId: 'J3000_USB', pinNumber: '1', netId: 'PP_VDD_MAIN', x: 0, y: -10, radius: 0.6, diodeValue: '0.395V' },
      { id: 'usb_2', partId: 'J3000_USB', pinNumber: '2', netId: 'PP_VDD_MAIN', x: 0, y: -5, radius: 0.6, diodeValue: '0.395V' },
      { id: 'usb_3', partId: 'J3000_USB', pinNumber: '3', netId: 'GND', x: 0, y: 0, radius: 0.6, diodeValue: '0.000V' },
      { id: 'usb_4', partId: 'J3000_USB', pinNumber: '4', netId: 'I2C_SDA', x: 0, y: 5, radius: 0.6, diodeValue: '0.430V' },
      { id: 'usb_5', partId: 'J3000_USB', pinNumber: '5', netId: 'GND', x: 0, y: 10, radius: 0.6, diodeValue: '0.000V' },
    ],
  });

  return {
    id: 'sample_board',
    title: 'Sample Logic Board',
    deviceModel: 'Test Device',
    width: 800,
    height: 600,
    layersCount: 4,
    nets,
    parts,
    outlinePoints: [
      { x: 50, y: 50 },
      { x: 750, y: 50 },
      { x: 750, y: 550 },
      { x: 50, y: 550 },
    ],
  };
}

/**
 * Export sample data as JSON string for file download
 */
export function exportSampleBoardAsJSON(): string {
  const data = generateSampleBoardData();
  return JSON.stringify(data, null, 2);
}
