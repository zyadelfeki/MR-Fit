# MR-Fit 2.0 Hardware Bill of Materials (BOM)

## Cairo Procurement Benchmark (Bab El-Louk Target: ~1,080 EGP)

Benchmarked against Cairo electronics retailers (Ram Electronics, Future Electronics Egypt, Maker Select, U-Electronic):

| Subsystem | Component & Technical Spec | Recommended Production Tier | Week-1 MVP Fallback | Cairo Price (EGP) | Global Equivalent (USD) | Primary Cairo Supplier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Compute Core** | ESP32-S3-WROOM-1 Mini (Dual-Core 240 MHz, BLE 5.0, 512KB SRAM, 8MB Flash) | ESP32-S3 Mini | ESP32-WROOM-32D | 240 EGP | $5.00 | Ram / Future Electronics |
| **Inertial Sensor** | Bosch BMI270 6-Axis IMU (160 $\mu g/\sqrt{\text{Hz}}$ noise density, hardware anti-aliasing DLPF) | Bosch BMI270 Breakout | InvenSense MPU-6050 | 280 EGP | $5.80 | U-Electronic / Maker Select |
| **Power Management** | TP4056 Type-C Lithium Charger with DW01A Over-Discharge / Over-Current Protection | TP4056 Type-C | TP4056 Micro-USB | 35 EGP | $0.75 | Bab El-Louk Market |
| **Energy Storage** | 3.7V 650 mAh Rechargeable LiPo Battery Pack (JST-PH 2.0 connector) | 650 mAh LiPo (4h+ runtime) | 350 mAh LiPo Cell | 160 EGP | $3.30 | Ram Electronics |
| **Haptic Actuator** | 1027 Coin Flat ERM Vibration Motor (3V, 80mA, 12,000 RPM) + 2N2222 + 1N4007 + 1kΩ | Coin ERM Circuit | None (Buzzer) | 45 EGP | $0.95 | Bab El-Louk Passives |
| **Physical Enclosure** | Custom 3D Printed Water-Resistant Case (PETG / SLA Tough Resin, IP54 seal) | SLA Resin Enclosure | FDM PLA Box | 120 EGP | $2.50 | Campus 3D FabLab |
| **Barbell Mount** | Quick-Lock 50mm Sleeve Clamp + Neodymium Magnets ($10 \times 3$ mm) + 2mm Silicone Grip | Quick-Lock Magnetic Clamp | Velcro Strap | 90 EGP | $1.90 | Bab El-Louk Hardware |
| **PCB & Passives** | Custom 2-Layer SMD Prototype PCB + 0.1uF / 10uF Decoupling Caps + Slide Switch | Custom 2-Layer PCB | Breadboard Wires | 110 EGP | $2.30 | Local PCB Fab / JLCPCB |
| **TOTAL BOM** | **Complete Wearable Barbell Node** | **Production Tier** | **MVP: 430 EGP** | **~1,080 EGP** | **~$22.50 USD** | **Bab El-Louk Cairo** |

---

## Component Selection Engineering Rationale

1. **Bosch BMI270 vs. MPU-6050:**
   - The MPU-6050 suffers from severe thermal gyroscope drift ($0.05^\circ/\text{s}/^\circ\text{C}$) and high noise density ($400\mu g/\sqrt{\text{Hz}}$). 
   - The BMI270 features an integrated anti-aliasing filter, draws only $685\mu\text{A}$ in high-performance mode, and has a noise density of $160\mu g/\sqrt{\text{Hz}}$, making it mathematically superior for double-integration velocity calculation ($\int a dt$).
2. **LiPo Battery Safety & Power Budget:**
   - ESP32-S3 drawing ~85 mA with BLE active + IMU drawing ~1 mA gives over **6.5 hours of continuous 100 Hz streaming** on a 650 mAh cell.
   - The DW01A protection IC cuts discharge at 3.0V, preventing cell degradation.
