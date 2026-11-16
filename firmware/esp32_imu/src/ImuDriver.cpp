#include "ImuDriver.h"
#include <Wire.h>
#include <Arduino.h>

#define MPU6050_ADDR         0x68
#define BMI270_ADDR          0x68 // SDO pulled low = 0x68, high = 0x69

// Scaling Constants
#define ACCEL_SCALE_8G       (8.0f * 9.80665f / 32768.0f)
#define GYRO_SCALE_1000DPS   (1000.0f * (float)M_PI / (180.0f * 32768.0f))

ImuDriver::ImuDriver() {}

bool ImuDriver::init() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, I2C_FREQUENCY_HZ);
    delay(50);

#if USE_BMI270
    return initBmi270();
#else
    return initMpu6050();
#endif
}

bool ImuDriver::initMpu6050() {
    // Wake up MPU-6050 (clear SLEEP bit in PWR_MGMT_1)
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x6B); // PWR_MGMT_1
    Wire.write(0x01); // Clock source: PLL with X axis gyroscope
    if (Wire.endTransmission() != 0) return false;

    // Set sample rate divider (1 kHz / (1 + 9) = 100 Hz ODR)
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x19); // SMPLRT_DIV
    Wire.write(0x09);
    Wire.endTransmission();

    // Set DLPF (Digital Low Pass Filter) to 42 Hz to prevent aliasing at 100 Hz
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x1A); // CONFIG
    Wire.write(0x03); // DLPF_CFG = 3 (Bandwidth: Accel 44Hz, Gyro 42Hz)
    Wire.endTransmission();

    // Set Gyroscope Full Scale Range to +/- 1000 deg/s
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x1B); // GYRO_CONFIG
    Wire.write(0x10); // FS_SEL = 2 (+/- 1000 deg/s)
    Wire.endTransmission();

    // Set Accelerometer Full Scale Range to +/- 8g
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x1C); // ACCEL_CONFIG
    Wire.write(0x10); // AFS_SEL = 2 (+/- 8g)
    Wire.endTransmission();

    return true;
}

bool ImuDriver::initBmi270() {
    // Software reset BMI270
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x7E); // CMD
    Wire.write(0xB6); // Soft-reset command
    Wire.endTransmission();
    delay(10);

    // Disable power-saving mode (PWR_CONF)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x7C); // PWR_CONF
    Wire.write(0x00); // ADV_PWR_SAVE = 0
    Wire.endTransmission();
    delay(5);

    // Set ACC_CONF: 100 Hz ODR, Normal mode, BWP=Normal (0x28)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x40); // ACC_CONF
    Wire.write(0x28); // 100 Hz ODR, BWP normal
    Wire.endTransmission();

    // Set ACC_RANGE: +/- 8g (0x02)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x41); // ACC_RANGE
    Wire.write(0x02); // 8g range
    Wire.endTransmission();

    // Set GYR_CONF: 100 Hz ODR, BWP=Normal (0x28)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x42); // GYR_CONF
    Wire.write(0x28); // 100 Hz ODR
    Wire.endTransmission();

    // Set GYR_RANGE: +/- 1000 dps (0x01)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x43); // GYR_RANGE
    Wire.write(0x01); // 1000 dps
    Wire.endTransmission();

    // Enable Accelerometer and Gyroscope in PWR_CTRL (0x0E = Accel + Gyro + Temp)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x7D); // PWR_CTRL
    Wire.write(0x0E); // Accel + Gyro on
    Wire.endTransmission();
    delay(10);

    return true;
}

void ImuDriver::calibrateGyro(uint16_t sampleCount) {
    float sumGx = 0.0f, sumGy = 0.0f, sumGz = 0.0f;
    int validSamples = 0;

    for (uint16_t i = 0; i < sampleCount; ++i) {
        int16_t rawA[3], rawG[3];
#if USE_BMI270
        if (readBmi270(rawA, rawG)) {
#else
        if (readMpu6050(rawA, rawG)) {
#endif
            sumGx += (float)rawG[0] * GYRO_SCALE_1000DPS;
            sumGy += (float)rawG[1] * GYRO_SCALE_1000DPS;
            sumGz += (float)rawG[2] * GYRO_SCALE_1000DPS;
            validSamples++;
        }
        delay(10);
    }

    if (validSamples > 0) {
        gyroBiasX = sumGx / validSamples;
        gyroBiasY = sumGy / validSamples;
        gyroBiasZ = sumGz / validSamples;
    }
}

bool ImuDriver::readMpu6050(int16_t* rawAccel, int16_t* rawGyro) {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(0x3B); // ACCEL_XOUT_H
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)14) != 14) return false;

    rawAccel[0] = (int16_t)((Wire.read() << 8) | Wire.read());
    rawAccel[1] = (int16_t)((Wire.read() << 8) | Wire.read());
    rawAccel[2] = (int16_t)((Wire.read() << 8) | Wire.read());
    Wire.read(); Wire.read(); // Skip temperature
    rawGyro[0]  = (int16_t)((Wire.read() << 8) | Wire.read());
    rawGyro[1]  = (int16_t)((Wire.read() << 8) | Wire.read());
    rawGyro[2]  = (int16_t)((Wire.read() << 8) | Wire.read());
    return true;
}

bool ImuDriver::readBmi270(int16_t* rawAccel, int16_t* rawGyro) {
    // Read 12 bytes burst: Accel X/Y/Z (6 bytes) + Gyro X/Y/Z (6 bytes) starting at ACC_X_LSB (0x0C)
    Wire.beginTransmission(BMI270_ADDR);
    Wire.write(0x0C);
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom((uint8_t)BMI270_ADDR, (uint8_t)12) != 12) return false;

    // BMI270 data is little-endian: LSB first, then MSB
    rawAccel[0] = (int16_t)(Wire.read() | (Wire.read() << 8));
    rawAccel[1] = (int16_t)(Wire.read() | (Wire.read() << 8));
    rawAccel[2] = (int16_t)(Wire.read() | (Wire.read() << 8));
    rawGyro[0]  = (int16_t)(Wire.read() | (Wire.read() << 8));
    rawGyro[1]  = (int16_t)(Wire.read() | (Wire.read() << 8));
    rawGyro[2]  = (int16_t)(Wire.read() | (Wire.read() << 8));
    return true;
}

bool ImuDriver::readSensor(float& ax, float& ay, float& az, float& gx, float& gy, float& gz) {
    int16_t rawA[3], rawG[3];
#if USE_BMI270
    if (!readBmi270(rawA, rawG)) return false;
#else
    if (!readMpu6050(rawA, rawG)) return false;
#endif

    ax = (float)rawA[0] * ACCEL_SCALE_8G;
    ay = (float)rawA[1] * ACCEL_SCALE_8G;
    az = (float)rawA[2] * ACCEL_SCALE_8G;

    gx = ((float)rawG[0] * GYRO_SCALE_1000DPS) - gyroBiasX;
    gy = ((float)rawG[1] * GYRO_SCALE_1000DPS) - gyroBiasY;
    gz = ((float)rawG[2] * GYRO_SCALE_1000DPS) - gyroBiasZ;
    return true;
}

bool ImuDriver::checkThreeTap(float az_raw, uint32_t now_ms) {
    if (now_ms < tapActiveUntilMs) {
        return true;
    }

    float az_g = fabsf(az_raw) / 9.80665f;
    if (az_g > TAP_THRESHOLD_G) {
        if (now_ms - lastTapMs > TAP_MIN_INTERVAL_MS) {
            if (tapCount == 0 || (now_ms - firstTapMs > TAP_WINDOW_MS)) {
                tapCount = 1;
                firstTapMs = now_ms;
            } else {
                tapCount++;
            }
            lastTapMs = now_ms;

            if (tapCount >= 3) {
                tapCount = 0;
                tapActiveUntilMs = now_ms + 1000; // Hold flag high for 1.0 second so Android catches it
                return true;
            }
        }
    }
    return false;
}

bool ImuDriver::checkStationaryDwell(float ax, float ay, float az) {
    float mag = sqrtf(ax * ax + ay * ay + az * az);
    float diff = fabsf(mag - 9.80665f);
    // Simple low-pass filter on variance
    movingVariance = 0.95f * movingVariance + 0.05f * diff;
    return (movingVariance < 0.25f); // Stationary when total variance < 0.25 m/s^2
}
