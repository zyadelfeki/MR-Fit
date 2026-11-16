#pragma once

#include <stdint.h>

// MR-Fit 2.0 Strict 20-Byte Binary BLE GATT Contract
// Fits within standard 23-byte BLE 4.2/5.0 ATT MTU without fragmentation or packet drops.
// Standard UUIDs for the MR-Fit Kinetic Telemetry Service and Characteristics.

#define MRFIT_SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define MRFIT_CHAR_IMU_DATA_UUID     "0000ffe1-0000-1000-8000-00805f9b34fb"  // Notify (100 Hz binary stream)
#define MRFIT_CHAR_CONTROL_UUID      "0000ffe2-0000-1000-8000-00805f9b34fb"  // Write (haptic triggers, tare, exercise mode)

// Status Flags Bitmasks (Byte 19)
#define MRFIT_FLAG_TAP_DETECTED      (1 << 0)  // Bit 0: 3-Tap Calibration Spike Detected (clock sync lock)
#define MRFIT_FLAG_STATIONARY_DWELL  (1 << 1)  // Bit 1: Barbell Racked / Stationary Dwell
#define MRFIT_FLAG_SEQ_MASK          (0x3F)    // Bits 2..7: 6-bit rolling sequence number (0..63)
#define MRFIT_FLAG_SEQ_SHIFT         2

// Fixed Scaling Factors
#define MRFIT_QUAT_SCALE             16384.0f  // Q14 fixed-point representation for quaternion
#define MRFIT_ACCEL_SCALE            1000.0f   // m/s^2 to mm/s^2

#pragma pack(push, 1)
struct BleImuPacket {
    uint32_t timestamp_ms;   // Bytes 0..3:  Monotonic ms since boot (esp_timer_get_time() / 1000)
    int16_t  quat_w;         // Bytes 4..5:  q_w * 16384 (Range: -1.0 to +1.0)
    int16_t  quat_x;         // Bytes 6..7:  q_x * 16384
    int16_t  quat_y;         // Bytes 8..9:  q_y * 16384
    int16_t  quat_z;         // Bytes 10..11: q_z * 16384
    int16_t  accel_x_mms2;   // Bytes 12..13: Linear dynamic accel X in mm/s^2 (1 m/s^2 = 1000)
    int16_t  accel_y_mms2;   // Bytes 14..15: Linear dynamic accel Y in mm/s^2
    int16_t  accel_z_mms2;   // Bytes 16..17: Linear dynamic accel Z in mm/s^2 (Vertical lift axis)
    uint8_t  battery_pct;    // Byte 18:     Battery percentage (0..100) via ADC voltage divider
    uint8_t  status_flags;   // Byte 19:     Bit 0: Calibration Tap Detected | Bit 1: Stationary Dwell (Racked) | Bits 2..7: Rolling Seq (0..63)
};
#pragma pack(pop)

static_assert(sizeof(BleImuPacket) == 20, "BLE packet must be exactly 20 bytes");
