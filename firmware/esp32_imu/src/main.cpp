#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/ringbuf.h>
#include <esp_timer.h>
#include <NimBLEDevice.h>

#include "Config.h"
#include "BleContract.h"
#include "ImuDriver.h"
#include "MadgwickAHRS.h"

// --- GLOBALS & HANDLES ---
static RingbufHandle_t s_packetRingBuffer = NULL;
static esp_timer_handle_t s_sampleTimer = NULL;
static SemaphoreHandle_t s_sampleTriggerSem = NULL;

static ImuDriver s_imu;
static MadgwickAHRS s_ahrs(IMU_SAMPLE_RATE_HZ, MADGWICK_BETA);

static NimBLEServer* s_pServer = nullptr;
static NimBLECharacteristic* s_pDataChar = nullptr;
static NimBLECharacteristic* s_pControlChar = nullptr;
static bool s_bleConnected = false;
static uint8_t s_rollingSeq = 0;

// Hardware Microsecond Timer Callback (Fires every 10,000 us = 100.0 Hz)
static void IRAM_ATTR onSampleTimer(void* arg) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(s_sampleTriggerSem, &xHigherPriorityTaskWoken);
    if (xHigherPriorityTaskWoken == pdTRUE) {
        portYIELD_FROM_ISR();
    }
}

// --- BLE CALLBACKS ---
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) override {
        s_bleConnected = true;
        digitalWrite(PIN_STATUS_LED, HIGH);
    }
    void onDisconnect(NimBLEServer* pServer) override {
        s_bleConnected = false;
        digitalWrite(PIN_STATUS_LED, LOW);
        NimBLEDevice::startAdvertising();
    }
};

class ControlCharCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic) override {
        std::string rxVal = pCharacteristic->getValue();
        if (rxVal.length() >= 1) {
            uint8_t cmd = rxVal[0];
            if (cmd == 0x01) {
                // Haptic Buzz: Short Pulse (Form fault or rep turnaround alert)
                digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
                delay(120);
                digitalWrite(PIN_HAPTIC_MOTOR, LOW);
            } else if (cmd == 0x02) {
                // Haptic Buzz: Double Pulse (VBT 20% fatigue threshold reached)
                digitalWrite(PIN_HAPTIC_MOTOR, HIGH); delay(100);
                digitalWrite(PIN_HAPTIC_MOTOR, LOW);  delay(80);
                digitalWrite(PIN_HAPTIC_MOTOR, HIGH); delay(100);
                digitalWrite(PIN_HAPTIC_MOTOR, LOW);
            }
        }
    }
};

// --- TASK 1: IMU SAMPLING & MADGWICK AHRS (PINNED TO CORE 1) ---
void Task_ImuSample(void* pvParameters) {
    while (true) {
        // Wait for deterministic 100 Hz hardware timer trigger
        if (xSemaphoreTake(s_sampleTriggerSem, portMAX_DELAY) == pdTRUE) {
            uint32_t now_ms = (uint32_t)(esp_timer_get_time() / 1000ULL);

            float ax, ay, az, gx, gy, gz;
            if (s_imu.readSensor(ax, ay, az, gx, gy, gz)) {
                // 1. Update Madgwick AHRS orientation quaternion
                s_ahrs.update(gx, gy, gz, ax, ay, az);

                // 2. Compute gravity-removed linear dynamic acceleration in world frame
                float ax_dyn, ay_dyn, az_dyn;
                s_ahrs.computeWorldDynamicAccel(ax, ay, az, ax_dyn, ay_dyn, az_dyn);

                // 3. Evaluate 3-Tap Sync and Stationary Dwell
                bool tap = s_imu.checkThreeTap(az, now_ms);
                bool dwell = s_imu.checkStationaryDwell(ax, ay, az);

                // 4. Sample battery percentage via ADC voltage divider
                int rawAdc = analogRead(PIN_BATTERY_ADC);
                // 3.7V LiPo: 4.2V max (ADC ~2450) to 3.4V min (ADC ~1980)
                uint8_t batteryPct = (uint8_t)constrain(map(rawAdc, 1980, 2450, 0, 100), 0, 100);

                // 5. Pack into strict 20-byte binary packet
                BleImuPacket packet;
                packet.timestamp_ms = now_ms;
                packet.quat_w = (int16_t)constrain((int)(s_ahrs.getQ0() * MRFIT_QUAT_SCALE), -32767, 32767);
                packet.quat_x = (int16_t)constrain((int)(s_ahrs.getQ1() * MRFIT_QUAT_SCALE), -32767, 32767);
                packet.quat_y = (int16_t)constrain((int)(s_ahrs.getQ2() * MRFIT_QUAT_SCALE), -32767, 32767);
                packet.quat_z = (int16_t)constrain((int)(s_ahrs.getQ3() * MRFIT_QUAT_SCALE), -32767, 32767);

                packet.accel_x_mms2 = (int16_t)constrain((int)(ax_dyn * MRFIT_ACCEL_SCALE), -32767, 32767);
                packet.accel_y_mms2 = (int16_t)constrain((int)(ay_dyn * MRFIT_ACCEL_SCALE), -32767, 32767);
                packet.accel_z_mms2 = (int16_t)constrain((int)(az_dyn * MRFIT_ACCEL_SCALE), -32767, 32767);

                packet.battery_pct = batteryPct;
                uint8_t flags = (s_rollingSeq & MRFIT_FLAG_SEQ_MASK) << MRFIT_FLAG_SEQ_SHIFT;
                if (tap)   flags |= MRFIT_FLAG_TAP_DETECTED;
                if (dwell) flags |= MRFIT_FLAG_STATIONARY_DWELL;
                packet.status_flags = flags;
                s_rollingSeq = (s_rollingSeq + 1) & 0x3F;

                // 6. Push to thread-safe FreeRTOS ring buffer
                xRingbufferSend(s_packetRingBuffer, &packet, sizeof(BleImuPacket), 0);
            }
        }
    }
}

// --- TASK 2: BLE NOTIFICATION TRANSMIT (PINNED TO CORE 0) ---
void Task_BleTransmit(void* pvParameters) {
    while (true) {
        size_t itemSize;
        BleImuPacket* pPacket = (BleImuPacket*)xRingbufferReceive(
            s_packetRingBuffer, &itemSize, pdMS_TO_TICKS(20)
        );

        if (pPacket != NULL) {
            if (s_bleConnected && s_pDataChar != nullptr) {
                s_pDataChar->setValue((uint8_t*)pPacket, sizeof(BleImuPacket));
                s_pDataChar->notify();
            }
            vRingbufferReturnItem(s_packetRingBuffer, (void*)pPacket);
        } else {
            vTaskDelay(pdMS_TO_TICKS(2));
        }
    }
}

void setup() {
    pinMode(PIN_HAPTIC_MOTOR, OUTPUT);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);
    pinMode(PIN_BATTERY_ADC, INPUT);

    // Initial brief buzz confirming hardware power-on
    digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
    delay(80);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);

    // 1. Initialize IMU and calibrate zero-rate gyro offset
    if (!s_imu.init()) {
        // Rapid blink code if I2C bus fails
        while (true) {
            digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
            delay(100);
        }
    }
    s_imu.calibrateGyro(200);

    // 2. Initialize NimBLE 5.0 Stack & Server
    NimBLEDevice::init("MR-Fit-IMU-01");
    NimBLEDevice::setPower(BLE_TX_POWER_LEVEL); // +9 dBm maximum RF boost

    s_pServer = NimBLEDevice::createServer();
    s_pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = s_pServer->createService(MRFIT_SERVICE_UUID);

    s_pDataChar = pService->createCharacteristic(
        MRFIT_CHAR_IMU_DATA_UUID,
        NIMBLE_PROPERTY::NOTIFY
    );

    s_pControlChar = pService->createCharacteristic(
        MRFIT_CHAR_CONTROL_UUID,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
    );
    s_pControlChar->setCallbacks(new ControlCharCallbacks());

    pService->start();

    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(MRFIT_SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->start();

    // 3. Create FreeRTOS ring buffer (512-packet capacity)
    s_packetRingBuffer = xRingbufferCreate(RING_BUFFER_SIZE_BYTES, RINGBUF_TYPE_NOSPLIT);
    s_sampleTriggerSem = xSemaphoreCreateBinary();

    // 4. Configure hardware microsecond timer (10,000 us = 100.0 Hz)
    const esp_timer_create_args_t timerArgs = {
        .callback = &onSampleTimer,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "imu_100hz_timer"
    };
    esp_timer_create(&timerArgs, &s_sampleTimer);
    esp_timer_start_periodic(s_sampleTimer, IMU_TIMER_INTERVAL_US);

    // 5. Pin Tasks to dual cores
    xTaskCreatePinnedToCore(Task_ImuSample,   "ImuSampleTask",  4096, NULL, 5, NULL, 1); // Core 1 (DSP/Sensing)
    xTaskCreatePinnedToCore(Task_BleTransmit, "BleTransTask",   4096, NULL, 4, NULL, 0); // Core 0 (Radio/BLE)
}

void loop() {
    // Zero-overhead loop — all work executed deterministically in FreeRTOS tasks
    vTaskDelay(pdMS_TO_TICKS(1000));
}
