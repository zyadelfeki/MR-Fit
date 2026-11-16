#include "MadgwickAHRS.h"

MadgwickAHRS::MadgwickAHRS(float sampleFreq, float beta)
    : beta(beta), invSampleFreq(1.0f / sampleFreq), q0(1.0f), q1(0.0f), q2(0.0f), q3(0.0f) {}

void MadgwickAHRS::update(float gx, float gy, float gz, float ax, float ay, float az) {
    float recipNorm;
    float s0, s1, s2, s3;
    float qDot1, qDot2, qDot3, qDot4;
    float _2q0, _2q1, _2q2, _2q3, _4q0, _4q1, _4q2, _8q1, _8q2, q0q0, q1q1, q2q2, q3q3;

    // Rate of change of quaternion from gyroscope
    qDot1 = 0.5f * (-q1 * gx - q2 * gy - q3 * gz);
    qDot2 = 0.5f * ( q0 * gx + q2 * gz - q3 * gy);
    qDot3 = 0.5f * ( q0 * gy - q1 * gz + q3 * gx);
    qDot4 = 0.5f * ( q0 * gz + q1 * gy - q2 * gx);

    // Compute feedback only if accelerometer measurement valid (avoids NaN in normalisation)
    if (!((ax == 0.0f) && (ay == 0.0f) && (az == 0.0f))) {
        // Normalise accelerometer measurement
        recipNorm = 1.0f / sqrtf(ax * ax + ay * ay + az * az);
        ax *= recipNorm;
        ay *= recipNorm;
        az *= recipNorm;

        // Auxiliary variables to avoid repeated arithmetic
        _2q0 = 2.0f * q0;
        _2q1 = 2.0f * q1;
        _2q2 = 2.0f * q2;
        _2q3 = 2.0f * q3;
        _4q0 = 4.0f * q0;
        _4q1 = 4.0f * q1;
        _4q2 = 4.0f * q2;
        _8q1 = 8.0f * q1;
        _8q2 = 8.0f * q2;
        q0q0 = q0 * q0;
        q1q1 = q1 * q1;
        q2q2 = q2 * q2;
        q3q3 = q3 * q3;

        // Gradient decent algorithm corrective step
        s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
        s1 = _4q1 * q3q3 - _2q3 * ax + 4.0f * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
        s2 = 4.0f * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
        s3 = 4.0f * q1q1 * q3 - _2q1 * ax + 4.0f * q2q2 * q3 - _2q2 * ay;

        recipNorm = 1.0f / sqrtf(s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3); // normalise step magnitude
        s0 *= recipNorm;
        s1 *= recipNorm;
        s2 *= recipNorm;
        s3 *= recipNorm;

        // Apply feedback step
        qDot1 -= beta * s0;
        qDot2 -= beta * s1;
        qDot3 -= beta * s2;
        qDot4 -= beta * s3;
    }

    // Integrate rate of change of quaternion to yield quaternion
    q0 += qDot1 * invSampleFreq;
    q1 += qDot2 * invSampleFreq;
    q2 += qDot3 * invSampleFreq;
    q3 += qDot4 * invSampleFreq;

    // Normalise quaternion
    recipNorm = 1.0f / sqrtf(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
    q0 *= recipNorm;
    q1 *= recipNorm;
    q2 *= recipNorm;
    q3 *= recipNorm;
}

void MadgwickAHRS::computeWorldDynamicAccel(
    float ax_raw, float ay_raw, float az_raw,
    float& ax_dyn, float& ay_dyn, float& az_dyn
) {
    // Vector rotation via quaternion conjugation: v_world = q * v_sensor * q*
    // Using standard rotation matrix derived from orientation quaternion [q0, q1, q2, q3]
    float r11 = 1.0f - 2.0f * (q2 * q2 + q3 * q3);
    float r12 = 2.0f * (q1 * q2 - q0 * q3);
    float r13 = 2.0f * (q1 * q3 + q0 * q2);

    float r21 = 2.0f * (q1 * q2 + q0 * q3);
    float r22 = 1.0f - 2.0f * (q1 * q1 + q3 * q3);
    float r23 = 2.0f * (q2 * q3 - q0 * q1);

    float r31 = 2.0f * (q1 * q3 - q0 * q2);
    float r32 = 2.0f * (q2 * q3 + q0 * q1);
    float r33 = 1.0f - 2.0f * (q1 * q1 + q2 * q2);

    float ax_w = r11 * ax_raw + r12 * ay_raw + r13 * az_raw;
    float ay_w = r21 * ax_raw + r22 * ay_raw + r23 * az_raw;
    float az_w = r31 * ax_raw + r32 * ay_raw + r33 * az_raw;

    // Subtract 1g (9.80665 m/s^2) along the vertical world Z-axis
    ax_dyn = ax_w;
    ay_dyn = ay_w;
    az_dyn = az_w - 9.80665f;
}
