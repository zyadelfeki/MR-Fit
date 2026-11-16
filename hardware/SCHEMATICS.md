# MR-Fit 2.0 Hardware Schematics & Wiring Guide

## 1. System Pinout & Netlist

### ESP32-S3 Mini / ESP32-WROOM-32 Pin Connections
```
                     +------------------------+
                     |        ESP32-S3        |
                     |                        |
[BMI270/MPU-6050]    |                        |
  VCC (3.3V) <-------+ 3V3                    |
  GND        <-------+ GND                    |
  SDA        <-------+ GPIO 4  (WROOM: GPIO21)|
  SCL        <-------+ GPIO 5  (WROOM: GPIO22)|
                     |                        |
[HAPTIC MOTOR DRIVER]|                        |
  Gate Drive --------+ GPIO 6  (WROOM: GPIO19)|
                     |                        |
[BATTERY MONITOR]    |                        |
  Divider Midpoint --+ GPIO 1  (WROOM: GPIO34)|
                     |                        |
[STATUS LED]         |                        |
  Anode -------------+ GPIO 2  (Onboard LED)  |
                     +------------------------+
```

---

## 2. Subsystem Schematic Details

### A. Haptic Motor Drive Circuit (Inductive Load Protection)
The 1027 coin vibration motor draws up to 85 mA at 3.3V, exceeding the ESP32 GPIO 20 mA sink/source limit. It requires an NPN driver with a flyback diode to suppress inductive back-EMF spikes:

```
                +3.3V (VCC)
                  |
                  +-------+
                  |       |
                [1N4007] [1027 Coin ERM Motor]
             (Cathode)|   |
                  +-------+
                  |
                Collector (C)
  ESP32 GPIO 6 --[ 1kΩ ]-- Base (B)  [2N2222 NPN]
                Emitter (E)
                  |
                 GND
```

### B. Battery Voltage Divider ADC Circuit
To measure a single-cell LiPo battery (3.4V empty to 4.2V fully charged) safely via the ESP32 ADC (0 to 3.3V range), a 1:2 resistive divider is used:

```
  BAT+ (3.4V - 4.2V)
      |
    [100kΩ 1%]
      |
      +------> ESP32 GPIO 1 (ADC1_CH0 / WROOM: GPIO34)
      |        (Measured Voltage: 1.7V to 2.1V)
    [100kΩ 1%]
      |
     GND
```
*Note: A 0.1 µF ceramic capacitor placed across GPIO 1 and GND stabilizes high-frequency ADC switching noise.*

### C. Power Rail & Decoupling
- **TP4056 Type-C Charger:** Connects via 2-pin JST-PH 2.0 to 3.7V 650 mAh LiPo battery.
- **LDO Regulator (AMS1117-3.3 or AP2112K-3.3):** Converts 3.7V LiPo output down to clean, low-noise 3.3V rail.
- **Decoupling Capacitors:**
  - $10\mu\text{F}$ 16V tantalum capacitor across LDO output.
  - $0.1\mu\text{F}$ 0603 ceramic capacitor located $< 3\text{ mm}$ from BMI270 VDD pin.
