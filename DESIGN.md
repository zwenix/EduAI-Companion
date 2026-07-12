# EduAI Companion Design System & Visual Specification 🎨

This document defines the formal design language, visual tokens, custom Tailwind classes, typography scales, accessibility engines, and printing specifications used in **EduAI Companion**. This acts as the visual and structural source of truth for keeping the workspace's layout polished, playful, energetic, and highly legible.

---

## 🎨 1. Core Visual Mood & Aesthetic
The visual layer is governed by a high-contrast, modern, yet playful aesthetic themed around **"Learning is an Adventure"**. This balances two critical target demographics:
1.  **Educators/Teachers**: Need clear focus, high density, hierarchical structures, and professional printing layouts.
2.  **Children/Learners**: Need cognitive relief, sensory-friendly visual components, and engaging interaction states that reduce learning anxiety.

---

## 🧭 2. Color Palette & Brand Tokens
The application implements highly saturated accents paired with elegant, comfortable container bases. In Tailwind, these are mapped directly inside `@theme` variables:

| Color Token | Variable Name | HEX Value | Emotional/Functional Purpose |
| :--- | :--- | :--- | :--- |
| **Cyan (Action)** | `--color-brand-cyan` | `#06b6d4` | Interactive buttons, highlight badges, primary brand accents. |
| **Yellow (Joy)** | `--color-brand-yellow` | `#ffdf40` | Creative achievements, high scores, warm callout boxes. |
| **Pink (Creativity)**| `--color-brand-pink` | `#FF69B4` | Arts, creative assignments, visual guides, student milestones. |
| **Green (Success)** | `--color-brand-green` | `#2ed573` | Correct answers, passing scores, active user badges, completed state. |
| **Purple (Intelligence)**| `--color-brand-purple`| `#9b59b6`| AI engine features, automated completions, premium utilities. |
| **Navy Dark (Base)** | `--color-navy-dark` | `#0a0f21` | Dark Theme backdrop, offering comfortable screen time at night. |
| **Navy Deep (Terminal)**| `--color-navy-deep` | `#030611`| Absolute deep contrast for dark sidebar drawers and tables. |

---

## ✍️ 3. Typography Strategy & Web Fonts
EduAI Companion loads specialized, highly legible Google Fonts. Font families are segregated by age-group and content hierarchy:

*   **Display & Headings** (`font-display`): `"Quicksand"`, `"Plus Jakarta Sans"`, `"Fredoka"`
    *   *Purpose*: Rounded, friendly, high-character shapes for page headers, badges, and card titles.
*   **Body & UI Text** (`font-sans`): `"Quicksand"`, `"Plus Jakarta Sans"`, `"Fredoka"`, `"Nunito"`, `sans-serif`
    *   *Purpose*: High tracking, open counter-spaces, and tall x-heights to support speedy reading and comprehension.
*   **Aesthetic & Primary Grade Handwriting** (`font-hand` / `font-comic`): `"Patrick Hand"`, `"Comic Neue"`, `cursive`
    *   *Purpose*: Double-spaced tracer exercises, primary school handwriting mimics, and friendly student quotes.

---

## 🌀 4. Custom Architectural Classes & Layout Patterns

### 🌌 A. Glassmorphism (`.glass`)
Used heavily on cards and modals to create visual depth and premium overlays:
*   **Light Mode**: `bg-white/75 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_-5px_rgba(0,104,122,0.08),0_4px_12px_rgba(0,104,122,0.03)]`
*   **Dark Mode**: `bg-slate-950/45 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(3,6,17,0.45)]`

### 🌈 B. Gradient Mesh Backdrops (`.gradient-mesh`)
Generates ambient, soft radial lighting that sweeps slowly across the page backdrop:
*   **Light Mode**: Off-white base (`#f5fafc`) with cyan (25%), yellow (20%), and pink (15%) highlights.
*   **Dark Mode**: Ultra-dim navy base (`#050a18`) with deep violet, blue, and dark magenta flares.

### 🧸 C. Tactile Kid-Shadows (`.kid-shadow`)
Provides highly solid, physical feedback to cards and interactive components:
*   **Standard**: `shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]`
*   **Hover**: Active scaling transitions (`scale(1.02)`, `translateY(-3px)`) with expanded shadow spread: `shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_10px_10px_-5px_rgba(0,0,0,0.04)]`.

---

## 🧠 5. Inclusive & Accessible Education Layouts
EduAI Companion mitigates cognitive, visual, and physical learning barriers using reactive stylesheet overrides on `body`:

1.  **Dyslexia Reader Mode** (`.dyslexia-font-active`):
    *   Enforces `"Comic Neue"` as the global font.
    *   Applies a wider character tracking/letter-spacing (`0.05em`), expanded word spacing (`0.12em`), and deep comfortable line spacing (`1.75`) to prevent vertical reading slips.
2.  **Dyscalculia Rainbow Numbers**:
    *   Wraps adjacent numerical values into custom high-saturation multi-colored spans, enabling immediate cognitive differentiation.
3.  **Magnify Text Helper** (`.magnify-text-active`):
    *   Applies a micro-zoom to all text fields (`1.08rem`) for low-vision learners.
4.  **High Contrast Mode** (`.high-contrast-active`):
    *   Forces absolute black backgrounds (`#000000`), white body text (`#ffffff`), and bold high-intensity yellow border triggers (`#ffff00`) on call-to-action buttons.

---

## 🇿🇦 6. CAPS Printing Blueprint (`@media print`)
Since South African educators frequently need to print worksheets, exams, and lesson guides directly to A4 paper, a robust print override layout is loaded inside `index.css`:

*   **Print Target Scope**: If `.printable-doc` is active in the DOM, the printer stylesheet overrides and hides all screen elements (`visibility: hidden`), rendering only the targeted worksheet container on pristine A4 boundaries.
*   **Layout Safety & Overflows**: Disables absolute positioning, sidebars, scrolls, and gradients. Forces natural block elements with white backgrounds and black ink.
*   **Break Avoidance**: Elements styled with `.page-break-avoid`, `.question-block`, or `.problem-card` are guarded with `break-inside: avoid`, ensuring test questions are never split awkwardly across multiple A4 pages.

---

## 🍊 7. Visual Presets: Peach/Orangish Theme Mode (`.peach-theme`)
For environments requesting high-intensity, warm, creative colors without blinding high-contrast blue light, the application loads a global `.peach-theme` override block:
*   **Brand Shift**: Shifts cyan highlights to extremely high-intensity bright neon peach/coral (`#ff5e36`) and yellow to deep reddish terracotta.
*   **Canvas Shift**: Swaps standard white/gray backdrops with a dim, classy warm cream background (`#efe8d9`).
*   **Type Shift**: Maps body text to solid cocoa/rust (`#431407`) for incredible visual contrast.
