# MR-FIT 2.0 — ANTIGRAVITY WORKSPACE RULES (ENGINEER 2 LEAD)

## 1. Project Mandate & Role
- **Project:** MR-Fit 2.0 (Multimodal Sensor Fusion, Edge Kinematics & Biomechanical Intelligence for Resistance Training).
- **Zyad's Role:** Engineer 2 — Embedded Systems, BLE Firmware & Hardware Mechanics Lead.
- **Owned Scope:** `/firmware/esp32_imu/` & `/hardware/` & `/firmware/tools/mock_ble_packet_generator.py`.
- **Ignore:** Legacy `open-wearables/` and `smart-tracker/api/main.py`. The ESP32 node communicates directly with Android over BLE 5.0 GATT.

## 2. Invariants & Rules (NEVER VIOLATE)
1. **Strict 20-Byte Binary BLE Packet:**
   - Every 100 Hz sample MUST fit inside `BleImuPacket` (20 bytes). Zero ASCII JSON strings over BLE.
2. **Deterministic Timing & No Delay:**
   - FreeRTOS dual-core model. Core 1 handles 100 Hz I2C sampling via `esp_timer_create` (10,000 µs interval). Core 0 handles NimBLE notifications. Never use `delay()` in `loop()`.
3. **Onboard Gravity Subtraction:**
   - Madgwick Quaternion Filter ($\beta = 0.041$) must run onboard at 100 Hz. Subtract 1g in the world frame before transmitting dynamic vertical acceleration.
4. **Hardware Abstraction (BMI270 + MPU-6050):**
   - Keep `ImuDriver` abstracted with compile-time switches so Week-1 breadboard tests on MPU-6050 run identically to production BMI270.

## 3. Context & Handoff
- Before making changes, read `memory-bank/activeContext.md` and `memory-bank/systemPatterns.md`.
- To inspect code, run: `python3 /home/zyadelfeki/.hermes/tools/repomap.py /home/zyadelfeki/projects/MR-Fit 512`.
- After every completed milestone, update `memory-bank/activeContext.md` and `memory-bank/progress.md`.
