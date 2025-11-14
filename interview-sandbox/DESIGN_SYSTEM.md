# Design System & Design Tokens

## Overview

A comprehensive, universal design system with design tokens that works for **any assignment domain**. Features:

- ✅ **Design Tokens** - CSS custom properties for colors, typography, spacing, shadows
- ✅ **Light/Dark Mode** - Automatic theme switching with persistence
- ✅ **Typography Scale** - Professional font system with proper hierarchy
- ✅ **Universal Colors** - Semantic color system that adapts to any domain
- ✅ **Responsive** - Mobile-first approach
- ✅ **Accessible** - WCAG compliant color contrasts

## Design Tokens

### Color Tokens

#### Primary Colors
- `--color-primary-50` through `--color-primary-900` - Primary brand colors
- Adapts to any domain (e-commerce, SaaS, healthcare, etc.)

#### Semantic Colors
- `--color-success` - Success states
- `--color-error` - Error states  
- `--color-warning` - Warning states
- `--color-info` - Informational states

#### Background Colors
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary background
- `--bg-tertiary` - Tertiary background

#### Text Colors
- `--text-primary` - Primary text
- `--text-secondary` - Secondary text
- `--text-tertiary` - Tertiary text
- `--text-inverse` - Inverse text (for dark backgrounds)

### Typography Tokens

#### Font Families
- `--font-sans` - System font stack (optimized for all platforms)
- `--font-mono` - Monospace font stack

#### Font Sizes
- `--font-size-xs` through `--font-size-5xl` - Complete type scale

#### Font Weights
- `--font-weight-light` (300)
- `--font-weight-normal` (400)
- `--font-weight-medium` (500)
- `--font-weight-semibold` (600)
- `--font-weight-bold` (700)

### Spacing Tokens

- `--spacing-0` through `--spacing-20` - Consistent spacing scale
- Based on 4px grid system

### Border Radius Tokens

- `--radius-sm` through `--radius-full` - Consistent border radius

### Shadow Tokens

- `--shadow-sm` through `--shadow-xl` - Elevation system

## Usage

### In Templates

```html
<!-- Using design tokens -->
<div style="background-color: var(--bg-primary); color: var(--text-primary);">
  <h1 style="color: var(--text-primary); font-size: var(--font-size-2xl);">
    Title
  </h1>
</div>

<!-- Using utility classes -->
<div class="bg-primary text-primary rounded-design-lg shadow-design-md">
  Content
</div>
```

### Theme Toggle

The theme toggle button is automatically included in the header. Users can switch between light and dark modes, and their preference is saved in localStorage.

```javascript
// Programmatically toggle theme
toggleTheme();

// Get current theme
const theme = localStorage.getItem('theme'); // 'light' or 'dark'
```

## Dark Mode

Dark mode is automatically applied when `data-theme="dark"` is set on the `<html>` element. The design tokens automatically adjust:

- Background colors become darker
- Text colors become lighter
- Borders adjust for better contrast
- Shadows become more pronounced

## File Structure

```
src/views/
├── assets/
│   ├── design-system.css    # Design tokens and base styles
│   └── theme-toggle.js      # Theme switching logic
├── layouts/
│   └── base.ejs             # Base layout with design system
└── ...
```

## Benefits

1. **Universal** - Works for any assignment domain
2. **Consistent** - Single source of truth for all design decisions
3. **Maintainable** - Change tokens, update entire system
4. **Accessible** - Proper color contrasts and semantic HTML
5. **Modern** - Uses CSS custom properties (design tokens)
6. **Professional** - Shows advanced frontend knowledge

## Customization

To customize for a specific domain:

1. **Update Primary Colors** - Modify `--color-primary-*` tokens
2. **Adjust Typography** - Change font families or sizes
3. **Modify Spacing** - Adjust spacing scale if needed
4. **Add Domain-Specific Tokens** - Add new tokens as needed

Example for e-commerce:
```css
:root {
  --color-primary-600: #e63946; /* Brand red */
  --color-primary-700: #d62828;
}
```

Example for healthcare:
```css
:root {
  --color-primary-600: #06b6d4; /* Medical blue */
  --color-primary-700: #0891b2;
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Custom Properties (CSS Variables) support required
- Graceful degradation for older browsers

---

**Status**: ✅ **READY** - Design system fully implemented and ready to use!

