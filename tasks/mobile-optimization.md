# Mobile-First Optimization - KleiderPfad

## Overview
Complete mobile-first redesign of KleiderPfad to work like a native mobile app on smartphones.

## Phase 1: Technical Foundation & Base Layout

### Task 1.1: Viewport & HTML Base Configuration
- [ ] Add proper viewport meta tag in layout.tsx
- [ ] Add theme-color meta tag
- [ ] Add apple-mobile-web-app-capable for PWA
- [ ] Ensure html/body have proper mobile styles

### Task 1.2: Design Tokens Update (globals.css)
- [ ] Update base font-size to 16px (rem-based)
- [ ] Ensure spacing scale uses 4px base (8, 12, 16, 24px)
- [ ] Update touch target minimums (44x44px / 48px height)
- [ ] Update border radius scale for modern feel
- [ ] Add CSS variables for safe-area insets
- [ ] Fix any fixed widths that cause horizontal scroll

### Task 1.3: AppShell - Header Redesign
- [ ] Remove duplicate logo (mobile + desktop topbar)
- [ ] Single responsive header with logo left, notification bell right
- [ ] Add notification badge support
- [ ] Ensure 48px minimum touch targets
- [ ] Compact header height (~56px)
- [ ] Proper safe-area handling for notched devices

### Task 1.4: AppShell - Bottom Navigation Redesign
- [ ] Increase icon size to 24-28px
- [ ] Increase label font-size to 11-12px
- [ ] Active state with clear visual indicator (color + background)
- [ ] 48px minimum height for touch targets
- [ ] Proper safe-area-bottom padding
- [ ] Ensure content padding-bottom accounts for nav height

## Phase 2: Core Pages - Mobile-First Redesign

### Task 2.1: Wardrobe/New - Clothing Capture Form
- [ ] Large prominent "Foto aufnehmen" button (full width, 56px height)
- [ ] Separate gallery access button
- [ ] Camera with rear-facing preference
- [ ] Large image preview after selection
- [ ] Retake/remove options on preview
- [ ] Single-column form layout
- [ ] Large touch-optimized select dropdowns
- [ ] Collapsible "Weitere Angaben" section
- [ ] Prominent save button with loading state
- [ ] Proper validation error display
- [ ] Prevent double submission

### Task 2.2: Wardrobe - List & Filters
- [ ] Card-based list (not table)
- [ ] Collapsible filter section
- [ ] Touch-friendly filter chips
- [ ] Search input with clear button
- [ ] Proper empty state with CTA

### Task 2.3: Wardrobe/[id] - Item Detail
- [ ] Large photo carousel/gallery
- [ ] Collapsible sections for details
- [ ] Touch-friendly edit form
- [ ] Proper action buttons

### Task 2.4: Packages - List & Detail
- [ ] Card-based package list
- [ ] Touch-friendly package detail
- [ ] Easy item selection for packages

### Task 2.5: Family - Household Management
- [ ] Card-based member list
- [ ] Touch-friendly invite creation
- [ ] QR code display for invite links
- [ ] Easy household switching

### Task 2.6: Transfers - Incoming/Outgoing
- [ ] Card-based transfer list
- [ ] Prominent accept/decline buttons
- [ ] Clear status indicators

### Task 2.7: Notifications
- [ ] Card-based notification list
- [ ] Swipe to mark read (optional)
- [ ] Clear unread indicator

## Phase 3: Form Components - Mobile Optimization

### Task 3.1: Input Components
- [ ] 48px minimum height
- [ ] 16px font-size to prevent iOS zoom
- [ ] Proper input types for native keyboards
- [ ] Clear error states
- [ ] Touch-friendly select dropdowns

### Task 3.2: Button Components
- [ ] 48px minimum height
- [ ] 56px for primary actions
- [ ] Full-width on mobile
- [ ] Loading states
- [ ] Active/touch feedback

### Task 3.3: PhotoCapture Component
- [ ] Full-screen camera view on mobile
- [ ] Large capture button (72px)
- [ ] Gallery access button
- [ ] Large preview with retake/remove

## Phase 4: Polish & Quality Assurance

### Task 4.1: Viewport Testing
- [ ] 320px - small phones
- [ ] 360px - Android
- [ ] 390px - typical phones
- [ ] 430px - large phones
- [ ] 768px - tablets
- [ ] 1024px+ - desktop

### Task 4.2: Functional Testing
- [ ] No horizontal scroll
- [ ] No overlapping text
- [ ] Readable font sizes (16px base)
- [ ] Visible buttons (48px min)
- [ ] Working bottom nav
- [ ] Camera/gallery access
- [ ] Form validation
- [ ] Keyboard visibility
- [ ] Portrait/landscape

### Task 4.3: Build & Lint
- [ ] TypeScript check passes
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Deploy to test server