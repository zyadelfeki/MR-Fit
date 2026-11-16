#pragma once

#include <stdint.h>
#include "Config.h"

class ImuDriver {
public:
    ImuDriver();

    // Initialize the physical sensor (BMI270 or MPU-6050) over Wire (I2C)
    bool init();

    // Perform stationary zero-rate gyro calibration (samples 200 frames / 2.0s)
    void calibrateGyro(uint16_t sampleCount = 200);

    // Read calibrated 6-axis measurements in SI units
    // Accel in m/s^2, Gyro in rad/s
    bool readSensor(float& ax, float& ay, float& az, float& gx, float& gy, float& gz);

    // Detect 3 vertical taps (> 2.5g) within a 3-second window
    bool checkThreeTap(float az_raw, uint32_t now_ms);

    // Evaluate stationary dwell / racked status based on recent variance
    bool checkStationaryDwell(float ax, float ay, float az);

private:
    float gyroBiasX = 0.0f;
    float gyroBiasY = 0.0f;
    float gyroBiasZ = 0.0f;

    // 3-Tap state tracking
    uint8_t tapCount = 0;
    uint32_t firstTapMs = 0;
    uint32_t lastTapMs = 0;
    uint32_t tapActiveUntilMs = 0;

    // Stationary dwell filter
    float movingVariance = 0.0f;

    bool initMpu6050();
    bool initBmi270();
    bool readMpu6050(int16_t* rawAccel, int16_t* rawGyro);
    bool readBmi270(int16_t* rawAccel, int16_t* rawGyro);
};
