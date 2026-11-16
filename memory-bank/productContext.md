# Product Context: MR-Fit 2.0

## Why MR-Fit 1.0 Failed
MR-Fit 1.0 evaluated squat depth using a single web camera and hardcoded geometric heuristics ($\theta < 85^\circ$).
- Browser JavaScript introduced 15–40 ms frame processing jitter.
- Monocular camera viewing a lifter at an angle suffered from severe planar perspective distortion.
- Visual occlusion (plates/knees blocking joints) broke keypoint detection at the bottom of the squat.
- No ability to track velocity loss, power decay, or barbell tilt asymmetry.

## The MR-Fit 2.0 Edge Kinematics Solution
MR-Fit 2.0 fuses 30 FPS phone camera video with a high-frequency 100 Hz barbell IMU:
1. **Velocity-Based Training (VBT):** Mean Propulsive Velocity (MPV) calculated directly from fused linear acceleration gives athletes objective real-time fatigue feedback (*"20% velocity drop detected; terminate set"*).
2. **Form Fault Scoring:** Continuous Mahalanobis distance scoring against personalized warm-up baselines detects knee valgus collapse, spinal flexion, and uneven hip rise.
3. **Low Hardware Cost:** Built for ~1,080 EGP (~$22.50 USD), outperforming commercial $3,500 gym systems (Tonal, Vitruvian).
