#pragma once

#include <Arduino.h>

// ==============================================================================
// MR-Fit 2.0 Embedded Firmware Configuration
// Target Hardware: ESP32-S3-WROOM-1 Mini (Production) / ESP32-WROOM-32D (Fallback)
// ==============================================================================

// --- HARDWARE ABSTRACTION COMPILER SWITCH ---
// Set to 1 to compile for Bosch BMI270 (Production, 160 ug/rtHz noise density).
// Set to 0 to compile for InvenSense MPU-6050 (Week-1 Cairo breadboard prototype).
#define USE_BMI270                    1

#if !USE_BMI270
  #define USE_MPU6050                 1
#endif

// --- PIN ASSIGNMENTS ---
#if CONFIG_IDF_TARGET_ESP32S3
  #define PIN_I2C_SDA                 4   // ESP32-S3 Mini default I2C SDA
  #define PIN_I2C_SCL                 5   // ESP32-S3 Mini default I2C SCL
  #define PIN_HAPTIC_MOTOR            6   // NPN 2N2222 gate for 1027 Coin ERM Motor
  #define PIN_BATTERY_ADC             1   // Voltage divider (100k / 100k) to ADC1
  #define PIN_STATUS_LED              2   // Onboard heartbeat LED
#else
  #define PIN_I2C_SDA                 21  // ESP32-WROOM-32 default I2C SDA
  #define PIN_I2C_SCL                 22  // ESP32-WROOM-32 default I2C SCL
  #define PIN_HAPTIC_MOTOR            19  // NPN 2N2222 gate
  #define PIN_BATTERY_ADC             34  // ADC1 Channel 6
  #define PIN_STATUS_LED              2   // Onboard LED
#endif

// --- BUS & TIMING SPECIFICATIONS ---
#define I2C_FREQUENCY_HZ              400000      // 400 kHz Fast-Mode I2C
#define IMU_SAMPLE_RATE_HZ            100         // 100.0 Hz deterministic ODR
#define IMU_TIMER_INTERVAL_US         10000       // 10,000 microseconds = 10.0 ms

// --- MADGWICK AHRS FILTER TUNING ---
// Optimal beta for resistance training barbell motion: bounds gyro drift without lag
#define MADGWICK_BETA                 0.041f
#define GRAVITY_MSS                   9.80665f

// --- BLE BUFFER & TRANSMISSION DEFENSE ---
// 512-packet circular ringbuffer in internal SRAM protects against 2.4 GHz RF collisions
#define RING_BUFFER_PACKET_CAPACITY   512
#define RING_BUFFER_SIZE_BYTES        (20 * RING_BUFFER_PACKET_CAPACITY)

// Maximum BLE RF Output (+9 dBm) to overcome congested presentation halls
#define BLE_TX_POWER_LEVEL            ESP_PWR_LVL_P9

// --- 3-TAP DETECTION CALIBRATION THRESHOLDS ---
#define TAP_THRESHOLD_G               2.5f        // Vertical jerk acceleration > 2.5g
#define TAP_WINDOW_MS                 3000        // Must detect 3 spikes within 3.0 seconds
#define TAP_MIN_INTERVAL_MS           200         // Debounce interval between taps
