# Technical Context: MR-Fit 2.0 Embedded Tier

## Environment & Build Tools
- **Framework:** PlatformIO (Espressif 32 platform, Arduino framework)
- **Primary Core:** ESP32-S3-WROOM-1 Mini (Dual-Core 240 MHz, BLE 5.0, 512KB SRAM)
- **Fallback Core:** ESP32-WROOM-32D (Standard 30-pin devboard)
- **BLE Stack:** `h2zero/NimBLE-Arduino` (Minimal RAM overhead, high notification throughput)

## Sensor Specifications
- **Bosch BMI270:**
  - Accelerometer: $\pm 8g$ range, 100 Hz ODR, anti-aliasing DLPF.
  - Gyroscope: $\pm 1000^\circ/\text{s}$ range, 100 Hz ODR.
  - Noise density: $160\mu g/\sqrt{\text{Hz}}$.
- **InvenSense MPU-6050 (Fallback):**
  - Accelerometer: $\pm 8g$ range, SMPLRT_DIV=9 (100 Hz).
  - Gyroscope: $\pm 1000^\circ/\text{s}$ range, DLPF=3 (42 Hz).

## Power & Mechanical Specs
- Battery: 3.7V 650 mAh LiPo Cell (~6.5 hours active streaming).
- Charger: TP4056 Type-C with DW01A protection IC.
- Actuator: 1027 Coin ERM Vibration Motor driven via 2N2222 NPN + 1N4007 flyback diode.
- Clamp: 50.4 mm Olympic sleeve diameter, PETG / SLA resin with 2mm silicone grip tape and N52 neodymium disc magnets.
