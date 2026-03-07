# Bugfix Requirements Document

## Introduction

The application currently displays a purple-themed animated background with gradient overlays, animated lines, particles, and orbs. Users require a white background theme while preserving all existing animations, transitions, and visual effects. This change affects the NebulaBG component in ScassiHero3D.tsx, which renders purple color shades throughout its canvas animations and CSS gradient overlays.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the application renders the background THEN the system displays purple-colored animated lines using PURPLE_SHADES array with values like "rgba(124,58,237,", "rgba(168,85,247,", etc.

1.2 WHEN the application renders floating orbs THEN the system displays purple gradient orbs with hue values ranging from 260-320 (purple spectrum)

1.3 WHEN the application renders sparkle particles THEN the system displays purple-tinted particles with hue values ranging from 250-330 (purple spectrum)

1.4 WHEN the application renders cursor effects THEN the system displays purple cursor influence orbs and ripples using colors like "rgba(168,85,247,0.12)" and "rgba(124,58,237,0.05)"

1.5 WHEN the application renders CSS gradient overlays THEN the system displays purple radial gradients using colors like "rgba(167,139,250,0.18)", "rgba(124,58,237,0.22)", "rgba(88,28,199,0.16)"

1.6 WHEN the application renders diagonal accent streaks THEN the system displays purple linear gradients using colors like "rgba(196,130,255,0.5)", "rgba(124,58,237,0.7)"

### Expected Behavior (Correct)

2.1 WHEN the application renders the background THEN the system SHALL display white/light-gray-colored animated lines while maintaining all animation properties (speed, opacity, width, dash patterns)

2.2 WHEN the application renders floating orbs THEN the system SHALL display white/light-gray gradient orbs with neutral hue values (0 or grayscale) while maintaining all movement, pulsing, and size properties

2.3 WHEN the application renders sparkle particles THEN the system SHALL display white/light-gray particles with neutral hue values while maintaining all opacity pulsing and positioning

2.4 WHEN the application renders cursor effects THEN the system SHALL display white/light-gray cursor influence orbs and ripples while maintaining all interaction behaviors

2.5 WHEN the application renders CSS gradient overlays THEN the system SHALL display white/light-gray radial gradients while maintaining all positioning, sizing, and animation keyframes

2.6 WHEN the application renders diagonal accent streaks THEN the system SHALL display white/light-gray linear gradients while maintaining all positioning and animation properties

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the background animations run THEN the system SHALL CONTINUE TO animate lines with the same speed, easing, and progress calculations

3.2 WHEN orbs move across the screen THEN the system SHALL CONTINUE TO use the same velocity, phase, and boundary wrapping logic

3.3 WHEN particles pulse THEN the system SHALL CONTINUE TO use the same opacity calculations and timing

3.4 WHEN users move their cursor THEN the system SHALL CONTINUE TO track mouse position and create ripple effects on click

3.5 WHEN the window resizes THEN the system SHALL CONTINUE TO adjust canvas dimensions and reposition elements

3.6 WHEN CSS gradient overlays animate THEN the system SHALL CONTINUE TO use the same keyframe animations (cssOrb1, cssOrb2, cssOrb3, lineFloat)

3.7 WHEN the component mounts/unmounts THEN the system SHALL CONTINUE TO properly initialize and cleanup event listeners and animation frames
