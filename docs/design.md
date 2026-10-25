# MEDICLINIC Enterprise Design System
## Clinical Precision Meets Ergonomic Velocity

---

### Document Control
- **Document Version**: 2.4.0
- **Design Philosophy**: High-Density Precision Clinical Engineering
- **CSS Engine**: Tailwind CSS v4 + Semantic Design Tokens
- **Target Surfaces**: Desktop Workstations (1440p / 1080p), Tablet Triage Stations, Kiosk Terminals, Mobile Patient Portals
- **Compliance**: WCAG 2.1 AA Contrast, Ergonomic Night Shift Standard

---

## 1. Design Philosophy & Guiding Principles

Healthcare applications require extreme clarity under cognitive pressure. In an outpatient clinic, doctors, nurses, and pharmacists process dozens of patients daily. Visual clutter, ambiguous buttons, or sluggish animations cause clinical fatigue and operational bottlenecks.

The **MEDICLINIC Enterprise Design System** is anchored in four core principles:

1. **Zero Fluff, 100% Precision (The Flat Corner Standard)**:
   All visual elements—cards, buttons, modal dialogs, status badges, and table rows—feature crisp, sharp geometries (`rounded-none`). Rounded corners waste micro-pixels and soften visual boundaries; sharp corners provide clear delineation of clinical data points.
2. **Deterministic Information Hierarchy**:
   Every visual card follows a strict three-tier density model: Primary Action &rarr; Quantitative Telemetry (tabular numbers) &rarr; Micro-Captions.
3. **Ergonomic Velocity & Keyboard-First Navigation**:
   Every frequent workflow (switching consultation tabs, viewing queue roster, signing charts) has dedicated keyboard accelerators (<kbd>Alt</kbd>+<kbd>1..4</kbd>, <kbd>Alt</kbd>+<kbd>R</kbd>, <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).
4. **Adaptive Environmental Palettes**:
   Seamless transitions between crisp Daylight Ice-Mint and high-contrast, low-glare Night Shift dark mode for dimly lit consultation rooms.

---

## 2. Design Tokens & Semantic Color Palette

### 2.1 Daylight Spectrum (Default Theme)

```css
@theme {
  /* Surfaces (Ice Mint Tinted) */
  --color-canvas: #f2f9f7;          /* Page backdrop: pale ice-mint */
  --color-surface: #ffffff;         /* Cards, active forms, modal bodies */
  --color-surface-muted: #f5fcfa;   /* Table stripes, secondary containers */
  --color-surface-accent: #eef9f6;  /* Soft headers, active selections */
  --color-surface-strong: #e0f4ef;  /* Hover and active states */

  /* Structural Lines & Dividers */
  --color-line-subtle: #dbebe6;     /* Internal table row dividers */
  --color-line: #cde2dc;            /* Card borders, input borders */
  --color-line-strong: #9fc7bd;     /* Focus rings, emphasized boundaries */

  /* Ink & Typography */
  --color-ink: #0d2826;             /* Primary headings, body copy (high contrast) */
  --color-subtle: #3a5c57;          /* Secondary metadata, table headers */
  --color-muted: #587780;           /* Timestamps, micro-captions */
  --color-accent: #0f766e;          /* Link text, focused labels, ticket IDs */

  /* Brand & Primary Actions */
  --color-brand: #0d9488;           /* Brand accents, active highlights */
  --color-primary: #0f766e;         /* Filled action buttons (AA contrast on white) */
  --color-primary-hover: #115e59;   /* Hover state on primary buttons */

  /* Chrome App Header & Top Navigation */
  --color-chrome: #087873;          /* Main top-bar header */
  --color-chrome-nav: #0d9488;      /* Active navigation tab background */
  --color-chrome-deep: #065f5b;     /* Selected clinic identifier */
  --color-chrome-line: #054a47;     /* Header bottom border line */
}
```

### 2.2 Night Shift Spectrum (Dark Mode)
Designed for low-ambient consultation and triage rooms to eliminate monitor glare:

```css
.dark {
  --color-canvas: #07252d;          /* Deep teal background */
  --color-surface: #082830;         /* Night surface cards */
  --color-surface-muted: #09333e;   /* Alternating table rows */
  --color-surface-accent: #0b3d4a;  /* Highlighted panels */
  --color-surface-strong: #0e4857;  /* Active hover surface */

  --color-line-subtle: rgba(45, 212, 191, 0.15);
  --color-line: rgba(45, 212, 191, 0.25);
  --color-line-strong: rgba(45, 212, 191, 0.45);

  --color-ink: #f0fdfa;             /* High-legibility crisp white */
  --color-subtle: #99f6e4;          /* Soft teal secondary text */
  --color-muted: #5eead4;           /* Micro metadata */
  --color-accent: #2dd4bf;          /* Luminous brand highlight */
}
```

---

## 3. Typography System & Dual-Font Brand Hierarchy

### 3.1 Type Scale & Font Families
- **Primary Body Font**: `Inter`, system-ui, sans-serif
- **Tabular & Metrics Font**: `Inter` with OpenType `tnum` (tabular numerals) enabled for vital signs, queue tickets, prices, and timestamps.
- **Code & Payload Font**: `ui-monospace`, `Cascadia Mono`, `SFMono-Regular`, monospace for ICD-10 codes, NRICs, and LHDN UUIDs.

| Token | Size | Line Height | Weight | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `text-2xs` | `0.75rem` (12px) | `1.0rem` | 600 / 700 | Status chips, table headers, micro-labels |
| `text-xs` | `0.8125rem` (13px)| `1.125rem` | 500 / 600 | Secondary metadata, patient ages, drug frequencies |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | 400 / 600 | Body text, input values, table cells |
| `text-base`| `1.0rem` (16px) | `1.5rem` | 600 | Card titles, modal headers |
| `text-lg` | `1.125rem` (18px) | `1.625rem`| 700 | Section headers, queue ticket numbers |
| `text-xl` | `1.25rem` (20px) | `1.75rem` | 700 | Patient full name on active consultation banner |

### 3.2 Dual-Font Brand Name System
The clinic brand name uses a dual-color visual system with medical suffix parsing (`splitBrandName`):
- Brand names containing known medical keywords (`CLINIC`, `KLINIK`, `CARE`, `HEALTH`, `MED`, `MEDICAL`, `MEDIC`) automatically split into a two-tone visual:
  - **First Segment**: Rendered in `--color-primary` (deep authoritative teal, weight 800).
  - **Second Segment**: Rendered in `--color-accent` (vibrant energetic mint, weight 600).
- Example: `"MEDICLINIC"` &rarr; `<span class="text-primary font-bold">MEDI</span><span class="text-accent font-medium">CLINIC</span>`.

---

## 4. Component Design Specifications

### 4.1 Buttons & Interactive Controls
All interactive buttons adhere to the flat geometry standard:
- **Primary Button (`.btn-primary`)**:
  - `bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-none border border-primary cursor-pointer active:scale-[0.99]`
- **Secondary Button (`.btn-secondary`)**:
  - `bg-surface hover:bg-surface-accent text-accent hover:text-ink font-bold text-xs border border-line rounded-none px-4 py-2 cursor-pointer`
- **Danger Action Button (`.btn-danger`)**:
  - `bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase rounded-none px-3 py-1.5 border border-rose-700`

### 4.2 Status Chips & Clinical Alerts
- **Allergy Contraindication Badge**:
  `bg-rose-100 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-300 dark:border-rose-600 font-mono text-2xs font-bold uppercase px-2 py-0.5 rounded-none inline-flex items-center gap-1`
- **ESI Acuity Level Chips**:
  - *ESI 1 (Resuscitation)*: Pulse red `bg-red-600 text-white font-bold`
  - *ESI 2 (Emergent)*: High amber `bg-orange-500 text-white font-bold`
  - *ESI 3 (Urgent)*: Yellow warning `bg-amber-400 text-slate-900 font-bold`
  - *ESI 4/5 (Less/Non-Urgent)*: Calm green `bg-emerald-600 text-white font-bold`
- **LHDN e-Invoice Status Chips**:
  - *Validated*: `bg-emerald-100 text-emerald-800 border-emerald-300 font-mono`
  - *Pending*: `bg-sky-100 text-sky-800 border-sky-300 font-mono`
  - *Rejected*: `bg-rose-100 text-rose-800 border-rose-300 font-mono`

### 4.3 Form Inputs & Clinical Data Capture
- **Inputs & Selects**:
  `bg-surface text-ink border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-none px-3 py-2 text-sm font-sans placeholder:text-muted`
- **Vital Sign Inputs**: Monospace font with built-in measurement unit suffixes (mmHg, bpm, °C) anchored to the right border.

---

## 5. Layout Architecture & Workstation Density

### 5.1 Doctor Workspace: Consultation Suite vs Queue Rail
- **100% Full-Width Focus**:
  By default, both the **Consultation Suite Standby** and the **Active Consultation Suite** occupy 100% of horizontal viewport width to maximize chart readability.
- **Slide-Over Queue Rail Drawer (<kbd>Alt</kbd>+<kbd>R</kbd>)**:
  Opens as a high-density, z-index elevated slide-over drawer on the left (`w-80 sm:w-96`) showing waiting patients, wait minutes, and allergy warnings without compressing the consultation canvas.
- **Optional Docked Side-Rail**:
  Doctors who prefer side-by-side multi-tasking can toggle the "Dock Side-Rail" button to render the Queue Rail beside the consultation screen, with an instant close (<kbd>X</kbd>) trigger.

### 5.2 Master-Detail Console Settings Navigation
The system configuration console replaces endless vertical scrolling with a structured Master-Detail layout:
- **Left Navigation Master Column (Width 280px)**: 8 operational categories with icons and sub-descriptions.
- **Right Detail Canvas (Flex-1)**: Card-based configuration forms with clear division of concerns.

---

## 6. Motion & Micro-Interactions

- **Animation Durations**: All transitions strictly capped at **150ms** (`transition-all duration-150 ease-in-out`). Healthcare workers must never wait on aesthetic animations.
- **Micro-State Signals**:
  - Pulsing emerald indicators (`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`) signaling active consultation audio broadcasts.
  - Non-blocking toast notifications positioned at top-right with high-contrast borders.

---

## 7. Keyboard Accessibility Map

| Shortcut | Context | Function |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>1</kbd> | Consultation Suite | Switch to **Subjective** SOAP Tab |
| <kbd>Alt</kbd> + <kbd>2</kbd> | Consultation Suite | Switch to **Objective (Vitals)** Tab |
| <kbd>Alt</kbd> + <kbd>3</kbd> | Consultation Suite | Switch to **Assessment (ICD-10)** Tab |
| <kbd>Alt</kbd> + <kbd>4</kbd> | Consultation Suite | Switch to **Plan (Prescriptions & MC)** Tab |
| <kbd>Alt</kbd> + <kbd>R</kbd> | Doctor Dashboard | Toggle **Queue Rail Drawer** |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Active Consultation | Electronically **Sign & Complete Consultation** |
| <kbd>Esc</kbd> | Any Modal / Drawer | Dismiss current dialog or close Queue Rail |

---
*End of Design System Document*
