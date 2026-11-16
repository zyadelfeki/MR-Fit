# Project Brief: MR-Fit 2.0

## Mission & Academic Objective
MR-Fit 2.0 is Zyad Elfeki's third and final graduation project at **Mansoura University (AI Engineering, "Senior 2027")**.
- **Full Title:** Multimodal Sensor Fusion, Edge Kinematics, and Biomechanical Intelligence for Resistance Training.
- **Repository:** https://github.com/zyadelfeki/MR-Fit
- **Core Research Question:** How accurately can an asynchronous cross-attention network, combining monocular 2D pose estimation (30 FPS) with a single 6-axis barbell/sacral IMU (100 Hz), measure compound exercise kinematics, joint shearing forces, and velocity loss compared to gold-standard reference systems?

## Zyad's Official Role
**Engineer 2 — Embedded Systems, BLE Firmware & Hardware Mechanics Lead**
- **Owned Directories:**
  - `/firmware/esp32_imu/` (C++ / PlatformIO / FreeRTOS)
  - `/hardware/` (PCB Schematics, BOM, 3D Clamp CAD)
  - `/firmware/tools/mock_ble_packet_generator.py` (Teammate data simulator)

## Non-Negotiable Engineering Invariants
1. **Zero Web Bloat & Zero Delayed Loops:**
   - Ban commercial smartwatches, browser WebGL MediaPipe JS, and legacy Arduino `delay()` polling scripts.
   - Dual-core ESP32-S3 FreeRTOS firmware with hardware microsecond timer (`esp_timer`) sampling at deterministic 100.0 Hz.
2. **Deterministic Onboard Gravity Subtraction:**
   - Onboard Madgwick Quaternion Filter ($\beta = 0.041$) rotates raw acceleration into the inertial world frame and subtracts 1g before transmission, making vertical velocity integration immune to barbell tilt.
3. **Strict 20-Byte Binary BLE GATT Contract:**
   - Packed into a 20-byte struct (`BleContract.h`) to fit inside a single unfragmented 23-byte ATT MTU packet. Zero ASCII/JSON serialization over radio.
4. **Local Hardware Procurement Target:**
   - Total BOM target $\sim 1,080\text{ EGP}$ (~$22.50 USD) benchmarked in Bab El-Louk, Cairo.
