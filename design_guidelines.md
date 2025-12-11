# Ticket Booking System Design Guidelines

## Design Approach

**Selected Framework:** Hybrid approach combining Material Design principles with RedBus/BookMyShow booking patterns

**Justification:** Booking systems require clarity, trust, and efficiency. Users need to quickly understand availability, make decisions, and complete transactions with confidence. The interface must handle complex information (seat grids, time slots, booking status) while remaining approachable.

**Key Design Principles:**
- Scan-ability over decoration: Information hierarchy guides users through booking flow
- Trust through clarity: Booking status, availability, and pricing always visible
- Progressive disclosure: Show complexity only when needed
- Confirmation feedback: Every action has clear visual confirmation

---

## Typography

**Font Stack:** Inter (via Google Fonts CDN) - clean, readable, professional

**Hierarchy:**
- H1 (Page titles): text-4xl, font-bold (36px)
- H2 (Section headers): text-2xl, font-semibold (24px)
- H3 (Card titles, show names): text-xl, font-semibold (20px)
- Body text: text-base, font-normal (16px)
- Small text (labels, metadata): text-sm, font-medium (14px)
- Micro text (seat numbers, timestamps): text-xs (12px)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Tight spacing: p-2, gap-2 (8px) - within components, seat grids
- Standard spacing: p-4, gap-4 (16px) - cards, form fields
- Section spacing: p-8, py-12 (32px, 48px) - major sections
- Page margins: px-6 md:px-12 (24px, 48px)

**Grid System:**
- Admin dashboard: Single column forms with max-w-2xl
- Show listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Seat selection: Dynamic grid based on layout (10 columns for bus, theater-style for shows)

---

## Component Library

### Navigation
- Sticky top navigation: h-16, horizontal layout, Admin/User toggle on right
- Breadcrumb trail for booking flow: Home > Shows > Seat Selection > Confirmation

### Admin Dashboard
**Create Show Form:**
- Form container: max-w-2xl mx-auto, p-8
- Input fields: h-12, rounded-lg, border-2, mb-4 spacing
- Labels: text-sm font-medium, mb-2
- Primary CTA button: h-12, rounded-lg, font-semibold
- Shows list table: Striped rows, h-14 per row, sticky header

### User Views

**Show/Trip Cards:**
- Card: rounded-xl, p-6, border-2, hover:shadow-lg transition
- Layout: Vertical stack with gap-4
- Show name: text-xl font-semibold
- Metadata row: flex justify-between items-center
- Time/date: text-sm with clock icon (Heroicons)
- Available seats: Pill badge (rounded-full px-3 py-1)
- Book button: w-full h-11 at bottom

**Seat Selection Grid:**
- Grid container: max-w-4xl mx-auto, p-8
- Seat: w-10 h-10, rounded-md, border-2, cursor-pointer
- Spacing: gap-2 between seats, gap-6 between rows
- Legend: Fixed bottom panel (h-16) showing Available/Selected/Booked with color-coded indicators
- Selection summary: Sticky top panel showing selected seats and total price

**Booking Status:**
- Status badges: inline-flex items-center, px-3 py-1, rounded-full, text-sm font-medium
- PENDING: Pulsing animation (animate-pulse)
- CONFIRMED: Checkmark icon (Heroicons check-circle)
- FAILED: X icon (Heroicons x-circle)

### Forms & Inputs
- Text inputs: h-12, px-4, rounded-lg, border-2, focus:ring-4
- Select dropdowns: Same dimensions as text inputs
- Date/time pickers: Inline calendar widget, h-12 trigger button
- Validation errors: text-sm, mt-1, with warning icon

### Modals & Overlays
- Confirmation modal: max-w-md, rounded-2xl, p-6
- Backdrop: Semi-transparent overlay (bg-opacity-50)
- Action buttons: Horizontal flex layout, gap-3, h-11

---

## Icons

**Library:** Heroicons (via CDN) - outline style for UI, solid for filled states

**Usage:**
- Navigation: Outline icons at 24px (w-6 h-6)
- Card metadata: Outline icons at 20px (w-5 h-5)
- Buttons: Leading icons at 20px
- Status indicators: Solid icons at 16px (w-4 h-4)
- Seat grid legend: Solid icons at 16px

---

## Animations

**Minimal & Purposeful:**
- Seat selection: Scale transform (scale-105) on hover, immediate selection feedback
- Booking status: Fade-in for status changes (transition-opacity duration-300)
- Loading states: Simple spinner (animate-spin) for API calls
- Card hover: Lift effect (hover:-translate-y-1 transition-transform)
- **No scroll animations, no complex transitions**

---

## Page-Specific Layouts

### Admin Dashboard (/)
- Two-tab interface: "Create Show" | "Manage Shows"
- Create: Centered form (max-w-2xl)
- Manage: Full-width table with search filter at top

### User Listing (/)
- Hero section: h-64, centered search/filter bar
- Shows grid below: 3-column responsive grid (collapse to 1 on mobile)
- Empty state: Centered message with illustration placeholder

### Booking Page (/booking/:id)
- Three-panel layout:
  - Left: Show details card (w-1/3, sticky)
  - Center: Seat grid (w-2/3)
  - Bottom: Fixed booking summary bar (h-20)

### Confirmation Screen
- Success: Centered card (max-w-lg), booking details, download/share options
- Failed: Centered card with retry CTA and reason

---

## Responsive Breakpoints
- Mobile (< 768px): Single column, full-width cards, simplified seat grid (6-8 cols)
- Tablet (768-1024px): 2-column grid, condensed seat layout
- Desktop (> 1024px): Full 3-column grid, optimal seat visibility (10-12 cols)