# System Patterns & Architecture Invariants: MR-Fit 2.0 Firmware

## Embedded Dual-Core FreeRTOS Pipeline
```mermaid
flowchart TD
    HW_TIMER[Hardware Timer 100 Hz (10,000 us)] --> ISR[IRAM ISR Trigger]
    ISR --> CORE1[Core 1: Task_ImuSample (Priority 5)]
    CORE1 --> I2C[400 kHz Fast-Mode I2C Burst]
    I2C --> IMU[BMI270 / MPU-6050]
    IMU --> AHRS[Madgwick AHRS 100 Hz (β=0.041)]
    AHRS --> ROT[World-Frame Rotation & 1g Subtraction]
    ROT --> PACK[Strict 20-Byte Little-Endian Pack]
    PACK --> RINGBUF[(FreeRTOS 512-Packet Ring Buffer)]
    RINGBUF --> CORE0[Core 0: Task_BleTransmit (Priority 4)]
    CORE0 --> NIMBLE[NimBLE 5.0 GATT Notify (+9 dBm)]
    NIMBLE --> PHONE[Android Foreground Service]
    PHONE -.->|Haptic Trigger Cmd| CHAR_CTRL[Control Characteristic 0xFFE2]
    CHAR_CTRL --> ERM[2N2222 + 1027 Coin ERM Motor]
```

## Critical System Invariants
1. **Hardware Abstraction Layer (HAL):**
   - Toggle `#define USE_BMI270 1` vs `0` in `Config.h`. Allows bench testing on standard 100 EGP MPU-6050 and instant swap to production Bosch BMI270 with zero FreeRTOS modifications.
2. **Sub-10ms Clock Sync via 3-Tap Spike:**
   - 3 consecutive vertical jerk spikes $> 2.5g$ within 3.0 seconds sets Bit 0 in `status_flags`.
   - Android application detects this flag to lock camera frame timestamp $t_0$ to IMU monotonic timestamp $T_0$ with sub-10ms alignment.
3. **RF Congestion Defense:**
   - Graduation halls suffer heavy 2.4 GHz congestion. Firmware boosts BLE TX power to maximum (+9 dBm / `ESP_PWR_LVL_P9`) and buffers unacknowledged samples across a 512-packet circular SRAM queue.
4. **Mechanical Anti-Slippage Clamp:**
   - High-tack 2mm silicone rubber + N52 neodymium magnets stop the pod from twisting around the 50mm Olympic barbell sleeve during deadlift drops.
