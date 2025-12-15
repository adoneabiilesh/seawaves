# All Colors Used in This Project

## 🎨 Color Palette Summary

This project uses a **Black & White** theme with shadcn/ui components. Here's a complete breakdown:

---

## 1. **Primary Theme Colors (Tailwind Config)**

### From `tailwind.config.js`:

| Color Variable | HSL Value | Hex Equivalent | Usage |
|---------------|-----------|----------------|-------|
| `border` | `hsl(0 0% 0%)` | `#000000` | All borders |
| `input` | `hsl(0 0% 0%)` | `#000000` | Input borders |
| `ring` | `hsl(0 0% 0%)` | `#000000` | Focus rings |
| `background` | `hsl(0 0% 100%)` | `#FFFFFF` | Page background |
| `foreground` | `hsl(0 0% 0%)` | `#000000` | Text color |
| `primary` | `hsl(0 0% 0%)` | `#000000` | Primary buttons |
| `primary-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | Text on primary |
| `secondary` | `hsl(0 0% 96%)` | `#F5F5F5` | Secondary backgrounds |
| `secondary-foreground` | `hsl(0 0% 0%)` | `#000000` | Text on secondary |
| `muted` | `hsl(0 0% 96%)` | `#F5F5F5` | Muted backgrounds |
| `muted-foreground` | `hsl(0 0% 45%)` | `#737373` | Muted text |
| `accent` | `hsl(0 0% 96%)` | `#F5F5F5` | Accent backgrounds |
| `accent-foreground` | `hsl(0 0% 0%)` | `#000000` | Text on accent |
| `destructive` | `hsl(0 0% 0%)` | `#000000` | Destructive actions |
| `destructive-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | Text on destructive |
| `card` | `hsl(0 0% 100%)` | `#FFFFFF` | Card backgrounds |
| `card-foreground` | `hsl(0 0% 0%)` | `#000000` | Card text |
| `popover` | `hsl(0 0% 100%)` | `#FFFFFF` | Popover backgrounds |
| `popover-foreground` | `hsl(0 0% 0%)` | `#000000` | Popover text |

---

## 2. **CSS Variables (globals.css)**

### From `app/globals.css`:

| Variable | HSL Value | Hex Equivalent |
|----------|-----------|----------------|
| `--background` | `0 0% 100%` | `#FFFFFF` |
| `--foreground` | `0 0% 0%` | `#000000` |
| `--card` | `0 0% 100%` | `#FFFFFF` |
| `--card-foreground` | `0 0% 0%` | `#000000` |
| `--popover` | `0 0% 100%` | `#FFFFFF` |
| `--popover-foreground` | `0 0% 0%` | `#000000` |
| `--primary` | `0 0% 0%` | `#000000` |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` |
| `--secondary` | `0 0% 96%` | `#F5F5F5` |
| `--secondary-foreground` | `0 0% 0%` | `#000000` |
| `--muted` | `0 0% 96%` | `#F5F5F5` |
| `--muted-foreground` | `0 0% 45%` | `#737373` |
| `--accent` | `0 0% 96%` | `#F5F5F5` |
| `--accent-foreground` | `0 0% 0%` | `#000000` |
| `--destructive` | `0 0% 0%` | `#000000` |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` |
| `--border` | `0 0% 0%` | `#000000` |
| `--input` | `0 0% 0%` | `#000000` |
| `--ring` | `0 0% 0%` | `#000000` |

---

## 3. **Legacy Colors (index.css)**

### From `index.css` (may be overridden by new theme):

| Color | Hex Value | Usage |
|-------|-----------|-------|
| Pure Black | `#000000` | Button backgrounds |
| Off-White | `#F5F5F0` | Text color (legacy) |
| Pure White | `#FFFFFF` | Background, hover states |
| Dark Gray | `#1A1A1A` | Button hover |
| Very Dark Gray | `#0A0A0A` | Button active |
| Light Gray (45%) | `#737373` | Muted text |
| Light Gray (96%) | `#F5F5F5` | Secondary backgrounds |

### Transparent/RGBA Colors:
- `rgba(0, 0, 0, 0.3)` - Input backgrounds
- `rgba(0, 0, 0, 0.4)` - Card backgrounds
- `rgba(0, 0, 0, 0.5)` - Dark backgrounds
- `rgba(245, 245, 240, 0.3)` - Border colors
- `rgba(245, 245, 240, 0.5)` - Scrollbar hover
- `rgba(245, 245, 240, 0.6)` - Placeholder text

---

## 4. **Component-Specific Colors**

### Charts (Recharts):
- **Area Chart Fill**: `#000000` (black gradient)
- **Bar Chart Fill**: `#000000` (black)
- **Grid Lines**: `#E5E7EB` (light gray)

### Status Indicators:
- **Active Status**: Black background (`#000000`)
- **Inactive Status**: White background with black border
- **Live Indicator**: Black dot (`#000000`)

---

## 5. **Tailwind Utility Classes Used**

### Background Colors:
- `bg-white` → `#FFFFFF`
- `bg-black` → `#000000`
- `bg-gray-50` → Light gray (overridden)
- `bg-gray-100` → Light gray (overridden)

### Text Colors:
- `text-black` → `#000000`
- `text-white` → `#FFFFFF`
- `text-gray-500` → Medium gray (overridden to black/white)
- `text-gray-700` → Dark gray (overridden)
- `text-black/50` → Black with 50% opacity
- `text-black/70` → Black with 70% opacity

### Border Colors:
- `border-black` → `#000000`
- `border-gray-100` → Light gray (overridden)
- `border-gray-200` → Light gray (overridden)

---

## 6. **Color Usage by Component**

### AdminPanel:
- White background (`#FFFFFF`)
- Black text (`#000000`)
- Black borders (`#000000`)
- Black buttons with white text
- White cards with black borders

### Navigation:
- White background (`#FFFFFF`)
- Black borders (`#000000`)
- Black buttons
- White text on black buttons

### KitchenDisplay:
- White background (`#FFFFFF`)
- Black borders (`#000000`)
- Black status badges
- White cards with black borders

---

## 7. **Color Scheme Summary**

### Primary Palette:
```
Black:     #000000  (Primary actions, borders, text)
White:     #FFFFFF  (Backgrounds, text on black)
Light Gray: #F5F5F5 (Secondary backgrounds, muted)
Dark Gray:  #737373 (Muted text)
```

### Opacity Variations:
- `black/5` → `rgba(0, 0, 0, 0.05)` - Very light hover
- `black/10` → `rgba(0, 0, 0, 0.1)` - Light borders
- `black/50` → `rgba(0, 0, 0, 0.5)` - Semi-transparent
- `black/70` → `rgba(0, 0, 0, 0.7)` - Dark overlay

---

## 8. **Design System**

This project follows a **strict black and white design system**:

- ✅ **Backgrounds**: Pure white (`#FFFFFF`)
- ✅ **Text**: Pure black (`#000000`)
- ✅ **Borders**: Pure black (`#000000`)
- ✅ **Buttons**: Black with white text, or white with black border
- ✅ **Cards**: White with black borders
- ✅ **No colors**: No brand colors, gradients, or accent colors

---

## Quick Reference

```css
/* Primary Colors */
--black: #000000;
--white: #FFFFFF;
--light-gray: #F5F5F5;
--muted-gray: #737373;

/* Usage */
Background: white
Text: black
Borders: black
Buttons: black (bg) + white (text)
Cards: white (bg) + black (border)
```

---

**Last Updated**: Based on current black & white theme implementation with shadcn/ui





