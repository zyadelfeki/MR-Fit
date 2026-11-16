#!/usr/bin/env python3
"""
mock_ble_packet_generator.py — MR-Fit 2.0 Mock Binary BLE Telemetry Streamer
=============================================================================
Day-1 Unblocking Tool for Engineer 3 (AI/Fusion) & Engineer 4 (Android Lead).
Generates synthetic 20-byte binary BLE GATT packets matching `BleContract.h`
at a precise 100.0 Hz ODR (10 ms intervals).

Simulates:
  - Phase 1: Stationary rest & 3-Tap Sync Spike (3 vertical jerk spikes > 2.5g)
  - Phase 2: Concentric/Eccentric Squat repetitions with gravity-removed vertical acceleration
  - Phase 3: Racked dwell & battery discharge telemetry

Usage:
  # Stream to local UDP socket for Android Emulator / Python pipeline testing:
  python3 mock_ble_packet_generator.py --udp 127.0.0.1:9099 --duration 30

  # Export 10 seconds of raw binary packets to a file:
  python3 mock_ble_packet_generator.py --export sample_squat_100hz.bin --duration 10

  # Decode and inspect a binary stream/file:
  python3 mock_ble_packet_generator.py --decode sample_squat_100hz.bin
"""

from __future__ import annotations

import argparse
import math
import socket
import struct
import sys
import time

PACKET_FORMAT = "<IhhhhhhhBB"
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)
assert PACKET_SIZE == 20, f"BleImuPacket must be 20 bytes, got {PACKET_SIZE}"

# Bitmask Constants
FLAG_TAP_DETECTED = 0x01
FLAG_STATIONARY_DWELL = 0x02
QUAT_SCALE = 16384.0  # Q14 fixed point
ACCEL_SCALE = 1000.0  # m/s^2 to mm/s^2


def pack_ble_imu_packet(
    timestamp_ms: int,
    quat: tuple[float, float, float, float],
    dynamic_accel_m_s2: tuple[float, float, float],
    battery_pct: int,
    tap_detected: bool,
    stationary: bool,
    seq: int,
) -> bytes:
    qw = max(-32767, min(32767, int(quat[0] * QUAT_SCALE)))
    qx = max(-32767, min(32767, int(quat[1] * QUAT_SCALE)))
    qy = max(-32767, min(32767, int(quat[2] * QUAT_SCALE)))
    qz = max(-32767, min(32767, int(quat[3] * QUAT_SCALE)))

    ax = max(-32767, min(32767, int(dynamic_accel_m_s2[0] * ACCEL_SCALE)))
    ay = max(-32767, min(32767, int(dynamic_accel_m_s2[1] * ACCEL_SCALE)))
    az = max(-32767, min(32767, int(dynamic_accel_m_s2[2] * ACCEL_SCALE)))

    flags = (seq & 0x3F) << 2
    if tap_detected:
        flags |= FLAG_TAP_DETECTED
    if stationary:
        flags |= FLAG_STATIONARY_DWELL

    return struct.pack(
        PACKET_FORMAT,
        timestamp_ms & 0xFFFFFFFF,
        qw,
        qx,
        qy,
        qz,
        ax,
        ay,
        az,
        max(0, min(100, battery_pct)),
        flags,
    )


def unpack_ble_imu_packet(raw: bytes) -> dict:
    if len(raw) != 20:
        raise ValueError(f"Expected 20 bytes, got {len(raw)}")
    ts, qw, qx, qy, qz, ax, ay, az, bat, flags = struct.unpack(PACKET_FORMAT, raw)
    seq = (flags >> 2) & 0x3F
    tap = bool(flags & FLAG_TAP_DETECTED)
    dwell = bool(flags & FLAG_STATIONARY_DWELL)
    return {
        "timestamp_ms": ts,
        "quat": (qw / QUAT_SCALE, qx / QUAT_SCALE, qy / QUAT_SCALE, qz / QUAT_SCALE),
        "accel_m_s2": (ax / ACCEL_SCALE, ay / ACCEL_SCALE, az / ACCEL_SCALE),
        "battery_pct": bat,
        "seq": seq,
        "tap_detected": tap,
        "stationary_dwell": dwell,
    }


def generate_simulated_packet(t_sec: float, seq: int) -> bytes:
    ts_ms = int(t_sec * 1000.0)
    battery_pct = max(20, int(98 - (t_sec / 1800.0) * 50))  # slow drain

    # 1. First 2 seconds: Stationary rest on rack
    if t_sec < 2.0:
        quat = (1.0, 0.0, 0.0, 0.0)
        accel = (0.01 * math.sin(t_sec * 10), 0.01 * math.cos(t_sec * 10), 0.0)
        return pack_ble_imu_packet(ts_ms, quat, accel, battery_pct, False, True, seq)

    # 2. t = 2.0s to 3.5s: 3-Tap Sync Sequence (3 sharp vertical jerk spikes > 2.5g)
    tap_times = [2.2, 2.6, 3.0]
    for tap_t in tap_times:
        if abs(t_sec - tap_t) < 0.03:
            quat = (0.999, 0.01, 0.02, 0.0)
            accel = (0.1, 0.05, 2.85)  # 2.85g vertical spike
            return pack_ble_imu_packet(ts_ms, quat, accel, battery_pct, True, False, seq)

    # 3. Dynamic Squat Cycles (Each rep is 3.0s: 1.5s eccentric, 0.3s turnaround, 1.2s concentric)
    rep_period = 3.2
    rep_time = (t_sec - 3.5) % rep_period
    phase = rep_time / rep_period

    # Tilt variation (sagittal roll / pitch)
    roll = 0.05 * math.sin(2.0 * math.pi * phase)
    pitch = 0.08 * math.sin(2.0 * math.pi * phase)
    qw = math.cos(roll / 2.0) * math.cos(pitch / 2.0)
    qx = math.sin(roll / 2.0)
    qy = math.sin(pitch / 2.0)
    qz = 0.0

    if phase < 0.45:
        # Eccentric descent: smooth negative acceleration
        vert_acc = -1.2 * math.sin(math.pi * (phase / 0.45))
    elif phase < 0.55:
        # Inflection / sticking point turnaround
        vert_acc = 0.8 * math.sin(math.pi * ((phase - 0.45) / 0.10))
    else:
        # Concentric drive: explosive upward acceleration peaking at +2.2 m/s^2, then deceleration to lockout
        drive_phase = (phase - 0.55) / 0.45
        vert_acc = 2.2 * math.sin(math.pi * drive_phase) - 0.5

    accel = (0.05 * math.sin(t_sec * 5), 0.08 * math.cos(t_sec * 5), vert_acc)
    return pack_ble_imu_packet(ts_ms, (qw, qx, qy, qz), accel, battery_pct, False, False, seq)


def main():
    parser = argparse.ArgumentParser(description="MR-Fit 2.0 Mock 100 Hz BLE Packet Streamer")
    parser.add_argument("--udp", type=str, help="Stream to UDP host:port (e.g. 127.0.0.1:9099)")
    parser.add_argument("--export", type=str, help="Write binary packets to a .bin file")
    parser.add_argument("--duration", type=float, default=15.0, help="Duration in seconds (default: 15.0s)")
    parser.add_argument("--decode", type=str, help="Decode and print an existing .bin packet capture")
    args = parser.parse_args()

    if args.decode:
        with open(args.decode, "rb") as f:
            data = f.read()
        total_packets = len(data) // 20
        print(f"Loaded {len(data)} bytes ({total_packets} packets) from {args.decode}")
        for i in range(min(total_packets, 25)):
            chunk = data[i * 20 : (i + 1) * 20]
            p = unpack_ble_imu_packet(chunk)
            print(
                f"[{p['timestamp_ms']:6d}ms | Seq:{p['seq']:02d}] "
                f"Quat=({p['quat'][0]:+.3f}, {p['quat'][1]:+.3f}, {p['quat'][2]:+.3f}, {p['quat'][3]:+.3f}) | "
                f"LinAccel=({p['accel_m_s2'][0]:+.2f}, {p['accel_m_s2'][1]:+.2f}, {p['accel_m_s2'][2]:+.2f}) m/s² | "
                f"Bat:{p['battery_pct']}% | Tap:{int(p['tap_detected'])} | Dwell:{int(p['stationary_dwell'])}"
            )
        if total_packets > 25:
            print(f"... [{total_packets - 25} packets omitted]")
        return

    total_samples = int(args.duration * 100)
    print(f"Generating {total_samples} packets (100 Hz ODR, {args.duration:.1f}s)...")

    out_file = open(args.export, "wb") if args.export else None
    sock = None
    target_addr = None
    if args.udp:
        host, port = args.udp.split(":")
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        target_addr = (host, int(port))
        print(f"Streaming live via UDP to {target_addr}...")

    dt = 0.010  # 10 ms = 100.0 Hz
    start_time = time.time()
    seq = 0

    try:
        for i in range(total_samples):
            t_sim = i * dt
            packet = generate_simulated_packet(t_sim, seq)
            seq = (seq + 1) & 0x3F

            if out_file:
                out_file.write(packet)
            if sock and target_addr:
                sock.sendto(packet, target_addr)

            if not out_file or (sock and target_addr):
                # Live pacing
                expected_time = start_time + t_sim
                sleep_sec = expected_time - time.time()
                if sleep_sec > 0:
                    time.sleep(sleep_sec)

        print(f"[SUCCESS] Emitted {total_samples} packets.")
        if args.export:
            print(f"Exported to: {args.export} ({total_samples * 20} bytes)")
    finally:
        if out_file:
            out_file.close()
        if sock:
            sock.close()


if __name__ == "__main__":
    main()
