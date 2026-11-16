# MR-Fit 2.0 Mechanical Specs: Barbell Clamp & Sacral Clip

## 1. Design Objectives & Defense Against Slippage
During explosive resistance training (especially dynamic deadlifts, cleans, and squat turnaround stick points), sudden floor impact or bar vibration can cause sensor rotation.
- **The Slippage Trap:** If the IMU twists around the barbell sleeve by even $10^\circ$, horizontal acceleration bleeds into the vertical lift axis, causing velocity integration divergence ($\int a dt$).
- **The Solution:** A dual-retention mechanism combining mechanical clamp tension, high-friction silicone dampening, and rare-earth neodymium magnetic anchoring.

---

## 2. Quick-Lock 50mm Barbell Sleeve Clamp (Olympic Standard)

```
        +----------------------------------------+
        |        Quick-Lock Cam Lever Clamp      |
        |                                        |
        |        /======================\        |
        |       /   Silicone 2mm Tape    \       |
        |      |                          |      |
        |      |   Standard 50mm Olympic  |      |
        |      |       Barbell Sleeve     |      |
        |      |                          |      |
        |       \   N52 Neodymium Magnets/       |
        |        \======================/        |
        |                                        |
        |    [Sealed IP54 ESP32/BMI270 Pod]      |
        +----------------------------------------+
```

### Engineering Specifications:
1. **Inner Diameter:** Exactly 50.4 mm (designed for standard Olympic barbell sleeves).
2. **Material:** Printed in PETG (100% infill) or SLA Tough 2000 Resin for dynamic impact resistance without brittle shattering.
3. **Inner Lining:** 2.0 mm high-tack silicone rubber foam tape bonded inside the upper and lower clamping jaws.
4. **Magnetic Anchoring:** Four embedded N52 neodymium disc magnets ($10\text{ mm diameter} \times 3\text{ mm thickness}$) press-fitted flush into the inner jaw to magnetically lock against steel barbell sleeves.
5. **Quick-Lock Mechanism:** Over-center cam lever mechanism with an M4 stainless-steel tension screw, enabling 1-second attachment and removal between sets.

---

## 3. L5–S1 Sacral Belt Clip (Push-Up & Bodyweight Kinematics)

For bodyweight push-ups and core kinematics:
- **Mounting Point:** The L5–S1 sacral junction (pelvic center of mass).
- **Design:** Low-profile ergonomic curved clip that slides firmly over a standard 40 mm nylon training belt.
- **Orientation Keying:** Physical keyed slot ensuring the IMU cannot be mounted upside down or at an angle relative to the spine.
- **Total Pod Dimensions:** $48\text{ mm} \times 36\text{ mm} \times 16\text{ mm}$. Total assembled weight: $\sim 38\text{ grams}$ (including battery).
