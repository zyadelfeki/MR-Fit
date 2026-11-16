#pragma once

#include <math.h>

class MadgwickAHRS {
public:
    MadgwickAHRS(float sampleFreq = 100.0f, float beta = 0.041f);

    // Update quaternion using 6-axis IMU data (gx, gy, gz in rad/s; ax, ay, az in m/s^2)
    void update(float gx, float gy, float gz, float ax, float ay, float az);

    // Compute gravity-compensated linear dynamic acceleration rotated into the world coordinate frame
    void computeWorldDynamicAccel(
        float ax_raw, float ay_raw, float az_raw,
        float& ax_dyn, float& ay_dyn, float& az_dyn
    );

    // Getters for quaternion components
    float getQ0() const { return q0; } // qw
    float getQ1() const { return q1; } // qx
    float getQ2() const { return q2; } // qy
    float getQ3() const { return q3; } // qz

private:
    float beta;         // Algorithm gain
    float invSampleFreq; // 1.0f / sampleFreq
    float q0, q1, q2, q3; // Quaternion of sensor frame relative to earth frame
};
