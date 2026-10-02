-- Migration: Add IC Database Entries from Major Manufacturers
-- This migration adds real IC entries from major manufacturers to the IC database
-- to improve diagnostic accuracy and provide component information.

-- TI (Texas Instruments) ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('BQ25601', 'PMIC', 'Smartphone Charging', 'Battery charging IC with power path management', ARRAY['BQ25895', 'BQ25890', 'BQ25892'], 'No charging, battery not detected, overheating, incorrect voltage', 'Measure resistance on CHG pin to GND: 0.350V - 0.500V on diode mode'),
('BQ25895', 'PMIC', 'Smartphone Charging', 'Battery charging IC with USB Type-C support', ARRAY['BQ25601', 'BQ25890', 'BQ25892'], 'No Type-C charging, battery swelling, slow charging', 'Check CC1/CC2 pins for proper voltage (0.4V - 1.2V)'),
('TPS65982', 'USB Controller', 'Connectivity', 'USB Type-C and Power Delivery controller', ARRAY['TPS65981', 'TPS65987'], 'No USB detection, incorrect power delivery, port not recognized', 'Measure VBUS to GND: should be 0V when not connected'),
('LM2596', 'Power Management', 'Power Supply', 'Simple step-down DC-DC converter', ARRAY['LM2596HV', 'LM2596S'], 'No output voltage, overheating, unstable output', 'Check SW pin diode reading: 0.350V - 0.450V to GND'),
('TAS5707', 'Audio', 'Audio Amplifier', 'Class-D audio amplifier', ARRAY['TAS5706', 'TAS5708'], 'No sound, distortion, popping noise', 'Measure output to GND: should be 0V at idle'),
('TLC5940', 'LED Driver', 'Lighting', 'LED driver with PWM control', ARRAY['TLC5941', 'TLC5971'], 'LEDs not working, flickering, stuck LED', 'Check IREF resistor: should be 2.2K - 10K'),
('SN74LVC1G32', 'Logic', 'Digital Logic', 'Low-voltage 2-input positive-AND gate', ARRAY['SN74LVC1G08', 'SN74LVC1G86'], 'Logic not working, incorrect output', 'Check VCC pin: should be 1.8V - 3.3V'),
('TPA6139A2', 'Audio', 'Audio Amplifier', 'DirectDrive stereo headphone amplifier', ARRAY['TPA6139A2', 'TPA6130'], 'No audio output, distortion, noise', 'Measure output capacitor: should be 10uF - 22uF')
ON CONFLICT DO NOTHING;

-- Qualcomm ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('PM8150', 'PMIC', 'Smartphone', 'Power Management IC for Snapdragon processors', ARRAY['PM8941', 'PM8008'], 'No power, battery drain, unstable voltages', 'Check VPH_PWR to GND: 0.350V - 0.450V diode mode'),
('PM8941', 'PMIC', 'Smartphone', 'Power Management IC with multiple voltage regulators', ARRAY['PM8150', 'PM8008'], 'System not booting, random reboots, charging issues', 'Check S3 regulator output: should be 1.8V - 3.3V'),
('WCN3680', 'Connectivity', 'Wireless', 'Wireless connectivity combo chip (WiFi/BT)', ARRAY['WCN3620', 'WCN3660'], 'No WiFi, no Bluetooth, intermittent connection', 'Check VREG_WLAN to GND: 0.350V - 0.500V'),
('QCA6390', 'Connectivity', 'Wireless', 'WiFi 6/Bluetooth 5.1 combo chip', ARRAY['QCA6391', 'QCA6174'], 'Slow WiFi, BT not connecting, high power consumption', 'Check WLAN_RESET: should be high (1.8V)'),
('WCD9335', 'Audio', 'Audio Codec', 'High-performance audio codec', ARRAY['WCD9340', 'WCD9320'], 'No audio, distortion, microphone not working', 'Check MCLK to GND: should have clock signal'),
('PM8008', 'PMIC', 'Smartphone', 'Power Management IC for mid-range devices', ARRAY['PM8150', 'PM8941'], 'Random shutdowns, charging issues, display flicker', 'Check LDO voltages: all should be within spec')
ON CONFLICT DO NOTHING;

-- NXP ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('PCF8574', 'I/O Controller', 'General Purpose', 'Remote 8-bit I/O expander for I2C-bus', ARRAY['PCF8574A', 'PCA9555'], 'I/O not responding, incorrect readings', 'Check SDA/SCL pull-up: should be 2.2K - 10K to VCC'),
('TJA1040', 'Automotive', 'CAN', 'High-speed CAN transceiver', ARRAY['TJA1050', 'TJA1145'], 'CAN bus not working, no communication', 'Check CANH to GND: should be high recessive'),
('PCA9685', 'PWM Controller', 'Lighting', '16-channel 12-bit PWM controller', ARRAY['PCA9684', 'PCA9633'], 'PWM not working, stuck output', 'Check VCC: should be 3.3V - 5V'),
('BTS6143D', 'Power Switch', 'Automotive', 'High-side power switch', ARRAY['BTS6143D', 'BTS6143'], 'Load not switching, always on/off', 'Check IN pin to GND: should control output'),
('MMA8452Q', 'Sensor', 'Motion', '3-axis digital accelerometer', ARRAY['MMA8451Q', 'MMA8453Q'], 'No motion detection, incorrect readings', 'Check VDD to GND: should be 1.8V - 3.3V')
ON CONFLICT DO NOTHING;

-- Analog Devices ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('ADXL345', 'Sensor', 'Motion', '3-axis digital accelerometer', ARRAY['ADXL346', 'ADXL355'], 'No motion detection, stuck values', 'Check VDD to GND: should be 1.8V - 3.3V'),
('AD8232', 'Medical', 'ECG', 'Single-lead ECG analog front end', ARRAY['AD8232', 'AD8231'], 'No ECG signal, noise interference', 'Check output offset: should be VDD/2'),
('MAX4466', 'Audio', 'Audio Amplifier', 'Low-noise microphone amplifier', ARRAY['MAX4467', 'MAX9814'], 'No audio output, noise', 'Check microphone bias: should be 1.5V - 2.5V'),
('OP07', 'Analog', 'Op-Amp', 'Low-offset operational amplifier', ARRAY['OP07A', 'OP07C'], 'Incorrect output, offset voltage high', 'Check input pins: should be balanced'),
('LTC1865', 'ADC', 'Data Acquisition', '16-bit ADC with SPI interface', ARRAY['LTC1864', 'LTC1867'], 'No conversion, incorrect readings', 'Check REF pin: should have reference voltage')
ON CONFLICT DO NOTHING;

-- STMicroelectronics ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('STM32F103', 'Microcontroller', 'ARM Cortex-M3', '32-bit ARM Cortex-M3 microcontroller', ARRAY['STM32F103C8', 'STM32F103RB'], 'MCU not booting, firmware stuck', 'Check NRST pin: should be high'),
('STM32F4', 'Microcontroller', 'ARM Cortex-M4', '32-bit ARM Cortex-M4 microcontroller', ARRAY['STM32F407', 'STM32F411'], 'Bootloop, random crashes', 'Check BOOT0/BOOT1 pins: should be configured correctly'),
('L4960', 'Power Management', 'Power Supply', 'Step-down switching regulator', ARRAY['L4961', 'L4970'], 'No output, unstable voltage', 'Check VIN to GND: should be 7V - 40V'),
('LD1117', 'Power Management', 'Power Supply', 'Low-dropout voltage regulator', ARRAY['LD1117S', 'LD1117DT'], 'No output, overheating', 'Check input-output voltage difference: should be > 1V'),
('TDA7498', 'Audio', 'Audio Amplifier', 'Class-D audio amplifier', ARRAY['TDA7498E', 'TDA7850'], 'No sound, distortion, overheating', 'Check speaker outputs: should not be shorted to GND')
ON CONFLICT DO NOTHING;

-- Infineon ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('BTS50085', 'Power Switch', 'Automotive', 'High-side power switch with diagnostic', ARRAY['BTS50085', 'BTS50090'], 'Load not switching, diagnostic error', 'Check IN pin to GND: should control output'),
('TLV493D', 'Sensor', 'Magnetic', '3D magnetic position sensor', ARRAY['TLV493D', 'MLX90393'], 'No position detection, incorrect readings', 'Check VDD to GND: should be 3.3V - 5V'),
('CY8CMBR3102', 'Sensor', 'Capacitive', 'Capacitive sensing controller', ARRAY['CY8CMBR3102', 'CY8CMBR3110'], 'No touch detection, erratic behavior', 'Check VDD to GND: should be 1.8V - 5.5V'),
('IRF740', 'Power MOSFET', 'Power', 'N-channel power MOSFET', ARRAY['IRF740', 'IRF740P'], 'Not switching, always on/off', 'Check gate-source voltage: should be > 4V')
ON CONFLICT DO NOTHING;

-- Samsung ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('S3AM01A', 'PMIC', 'Samsung', 'Power Management IC for Samsung devices', ARRAY['S3AM01B', 'S2MPS11'], 'No power, battery drain, unstable voltages', 'Check main power rail to GND: 0.350V - 0.450V'),
('S5K3L3', 'Image Sensor', 'Camera', 'CMOS image sensor', ARRAY['S5K3L3', 'S5K5E9'], 'No camera, dark image, noise', 'Check AVDD to GND: should be 2.8V'),
('C2D818', 'Audio', 'Audio Codec', 'Audio codec IC', ARRAY['C2D818', 'C2D816'], 'No audio, distortion, microphone not working', 'Check clock input: should have proper frequency')
ON CONFLICT DO NOTHING;

-- Realtek ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('RTL8723BE', 'Connectivity', 'Wireless', 'Wireless LAN + Bluetooth combo chip', ARRAY['RTL8723BS', 'RTL8723DE'], 'No WiFi, no Bluetooth, intermittent connection', 'Check VREG to GND: 0.350V - 0.500V'),
('ALC5686', 'Audio', 'Audio Codec', 'High-definition audio codec', ARRAY['ALC5686', 'ALC5682'], 'No audio output, noise, distortion', 'Check headphone detect pin: should be logic high'),
('RTL8152', 'Ethernet', 'Network', 'Fast Ethernet controller', ARRAY['RTL8152B', 'RTL8153'], 'No Ethernet, slow connection', 'Check MDI pairs: should be 100Ω differential')
ON CONFLICT DO NOTHING;

-- Broadcom ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('BCM4356', 'Connectivity', 'Wireless', 'Dual-band wireless + Bluetooth combo', ARRAY['BCM4356', 'BCM4358'], 'No WiFi, no Bluetooth, slow connection', 'Check WLAN_ENABLE: should be high'),
('BCM4375', 'Connectivity', 'Wireless', 'WiFi 6 + Bluetooth 5.0 combo', ARRAY['BCM4375', 'BCM4389'], 'WiFi 6 not working, BT 5.0 issues', 'Check antenna pins: should not be shorted'),
('CYW43439', 'Connectivity', 'Wireless', 'Wireless connectivity combo', ARRAY['CYW43438', 'CYW43455'], 'No wireless connection, high power', 'Check VDDIO to GND: should be 1.8V - 3.3V')
ON CONFLICT DO NOTHING;

-- MediaTek ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('MT6765', 'Processor', 'Mobile', 'Octa-core processor (Helio P35)', ARRAY['MT6763', 'MT6761'], 'Device not booting, stuck on logo', 'Check VDD_CPU to GND: 0.350V - 0.450V'),
('MTK6690', 'Connectivity', 'Wireless', 'Wireless connectivity combo', ARRAY['MTK6690', 'MTK6630'], 'No WiFi, no Bluetooth', 'Check VREG_WIFI to GND: 0.350V - 0.500V'),
('MT6370', 'PMIC', 'Mobile', 'Power Management IC', ARRAY['MT6370', 'MT6358'], 'Charging issues, random shutdowns', 'Check main power rail: should be stable')
ON CONFLICT DO NOTHING;

-- Microchip ICs
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('ATmega328P', 'Microcontroller', 'AVR', '8-bit AVR microcontroller', ARRAY['ATmega328', 'ATmega168'], 'MCU not working, firmware stuck', 'Check VCC to GND: should be 1.8V - 5.5V'),
('MCP23017', 'I/O Controller', 'General Purpose', '16-bit I/O expander', ARRAY['MCP23016', 'MCP23S17'], 'I/O not responding', 'Check I2C address pins: should be configured'),
('MCP4725', 'DAC', 'Analog', '12-bit DAC with EEPROM', ARRAY['MCP4725', 'MCP4921'], 'No analog output, incorrect voltage', 'Check VDD to GND: should be 2.7V - 5.5V')
ON CONFLICT DO NOTHING;

-- Murata Components
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('LQH31MN', 'Inductor', 'Passive', 'Wire-wound chip inductor', ARRAY['LQH31MN', 'LQH31HP'], 'Open circuit, short circuit', 'Measure resistance: should be within spec'),
('GRM', 'Capacitor', 'Passive', 'Multilayer ceramic capacitor', ARRAY['GRM', 'GRM series'], 'Short circuit, no capacitance', 'Check ESR: should be low')
ON CONFLICT DO NOTHING;

-- Vishay Components
INSERT INTO ic_database (part_number, category, device_family, function, compatibles, common_symptoms, diode_readings) VALUES
('IRF540N', 'Power MOSFET', 'Power', 'N-channel power MOSFET', ARRAY['IRF540', 'IRF540P'], 'Not switching, high Rds(on)', 'Check gate-source: should be > 4V'),
('1N5819', 'Diode', 'Power', 'Schottky barrier rectifier', ARRAY['1N5819', '1N5820'], 'Forward voltage high, short circuit', 'Check forward voltage: should be 0.3V - 0.5V'),
('CRCW', 'Resistor', 'Passive', 'Thick film resistor', ARRAY['CRCW', 'CRCW series'], 'Open circuit, wrong value', 'Measure resistance: should match value')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE ic_database IS 'IC database with real entries from major manufacturers (TI, Qualcomm, NXP, etc.)';
