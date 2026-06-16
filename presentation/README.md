# MR-Fit — Graduation Defense Deck

This folder generates the **actual `.pptx`** for the MR-Fit graduation defense,
built from the real screenshots in `../screenshots`.

## Build it

```bash
pip install python-pptx
python presentation/build_deck.py
```

Output: `presentation/MR-Fit_Graduation_Defense.pptx`

## Turn on the Prezi-style camera (one-time, 10 seconds)

`python-pptx` cannot write Morph/Zoom XML, so enable it in PowerPoint after
opening the file:

1. **Edit > Select All slides** in the thumbnail pane.
2. **Transitions > Morph**, set duration ~0.9s, click **Apply To All**.
3. Because every slide keeps the logo, tabs, and panels in consistent
   positions/sizes, Morph produces the smooth zoom/pan “one giant canvas” feel.
4. (Optional) Insert > **Zoom > Summary Zoom** to create the orbital
   section-jump navigation.

## Fonts (for the premium look)

Install these free fonts before presenting, or PowerPoint will substitute:

- **Sora** / **Space Grotesk** (headlines)
- **Inter** (body)
- **JetBrains Mono** (labels / code)

## Slide → Presenter map

| Slides | Section | Presenter |
|---|---|---|
| Title, Problem | Cold open + Problem | **P1** |
| Vision, Landing, Dashboard | Vision + product intro | **P2** |
| Workouts, Nutrition, Progress | Feature tour | **P3** |
| AI Brain, Form, Recovery, Coach | The AI systems | **P4** |
| Architecture | Engineering + security | **P5** |
| Demo, Results/Roadmap, Close | Demo + closing | **P6** |

Speaker notes are embedded in every slide's Notes pane.
