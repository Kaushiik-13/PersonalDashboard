# Signal Desk Design System

## Core Principles

### 1. Dark Theme Foundation
- **Background**: `#09090b` (near-black, not pure black)
- **Surface**: `#18181b` (subtle elevation)
- **Border**: `#27272a` (barely visible separation)
- **Text Primary**: `#fafafa` (pure white for headings)
- **Text Secondary**: `#a1a1aa` (muted for descriptions)
- **Text Tertiary**: `#71717a` (labels, metadata)

### 2. Typography
- **Font**: Inter, system-ui, sans-serif
- **Headings**: 600-700 weight, tight letter-spacing
- **Body**: 400 weight, 1.5-1.6 line-height
- **Small/Meta**: 12-13px, muted color
- **No decorative fonts** — pure utility

### 3. Spacing & Layout
- **Grid-based**: 8px base unit
- **Gaps**: 16px between cards, 24px between sections
- **Padding**: 16px inside cards, 24px page margins
- **Max-width**: Content constrained to ~1200px for readability

### 4. Component Patterns

#### Cards
- Subtle border: `1px solid #27272a`
- Background: `#09090b` or `#18181b`
- Hover: border brightens to `#3f3f46`, background shifts slightly
- **No shadows** — flat, border-based depth only

#### Navigation
- Left sidebar: 240-260px width
- Active state: subtle background `#18181b` + left border accent
- Inactive: transparent, text `#a1a1aa`
- Hover: text brightens to `#fafafa`

#### Badges/Pills
- Small, rounded-full or rounded-md
- Background: `#18181b` with border `#27272a`
- Text: `#a1a1aa`
- Active/Hot: white background, black text

#### Buttons
- Primary: white bg, black text, 600 weight
- Secondary: transparent bg, border `#27272a`, white text
- Ghost: no border, text only
- Icon buttons: 32-40px square, centered icon

#### Inputs/Search
- Background: `#09090b`
- Border: `#27272a`
- Focus: border `#52525b` or subtle ring
- Placeholder: `#71717a`

### 5. Color Accents
- **Primary**: White `#ffffff` (buttons, active states)
- **Success**: `#22c55e` (green)
- **Warning**: `#eab308` (yellow)
- **Error**: `#ef4444` (red)
- **Info/Changelog**: `#3b82f6` (blue dot)
- **No gradients** — solid colors only

### 6. Interaction States
- **Hover**: subtle brightness increase, no scale/transform
- **Active**: slight opacity reduction
- **Focus**: 2px ring `#52525b`
- **Disabled**: opacity 0.5, pointer-events none

### 7. Data Display
- **Tables**: minimal borders, row hover highlight
- **Lists**: compact, 8-12px gap between items
- **Numbers**: tabular-nums, right-aligned in columns
- **Dates**: relative or short format (Jun 02, 2h ago)
- **Scores**: prominent, bold, right-aligned

### 8. Empty States
- Centered content
- Muted icon or illustration
- Clear action text
- Primary CTA button

### 9. Loading States
- Skeleton loaders matching content shape
- Subtle shimmer animation
- No spinners for data regions

### 10. Responsive Behavior
- Sidebar collapses to top nav on mobile
- Grid becomes single column below 768px
- Touch targets minimum 44px on mobile

## Anti-Patterns (Avoid)
- ❌ Shadows for depth
- ❌ Gradients
- ❌ Rounded corners > 8px (except pills/buttons)
-  Decorative illustrations
- ❌ Bright saturated backgrounds
- ❌ Heavy borders
- ❌ Drop shadows on text
- ❌ Animated backgrounds

## Reference
Inspired by shadcn/ui documentation aesthetic. Clean, functional, developer-focused.
