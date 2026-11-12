# Implementation Plan: UI/UX Overhaul - Camera-First, Multi-Upload, Link-Based Invitations

## Overview
Significant UI/UX improvements based on user feedback:
1. **Desktop view erweitern** - Responsive layout that works well on desktop, not just mobile-first with fixed ratio
2. **Link-basierte Einladungen** - Replace invitation codes with shareable links (e.g., `/family/join/<token>`)
3. **Kamera-First für neue Bilder** - Primary photo capture via camera, with file upload as fallback
4. **Sekundärer Upload in Detailansicht** - Less prominent photo upload in item detail view
5. **Multi-File Upload Wizard** - Sequential photo capture → form per photo → save, with recovery via notifications
6. **Abbruch-Recovery** - Notification with link to complete abandoned uploads

## Architecture Decisions

- **Responsive Layout**: CSS Grid/Flexbox with proper breakpoints (640px, 1024px, 1440px). Shell max-width increases on desktop.
- **Link Invitations**: Replace `householdInvites.token` (hex) with slug-friendly tokens; new route `/family/join/:token` that auto-accepts
- **Camera-First**: Use `capture="environment"` on file input; show camera UI on mobile; file picker on desktop
- **Multi-Upload Wizard**: Client-side state machine (React) for sequential flow; persist draft to localStorage; server creates items only on final submit
- **Recovery Notifications**: New `notification` type `draft_recovery` with `data` JSON containing item draft info; link to `/wardrobe/new?draft=<id>`

## Task List

### Phase 1: Foundation - Responsive Layout & Components

- [ ] **Task 1**: Create responsive design tokens and breakpoints in globals.css
  - Acceptance: CSS variables for spacing, max-widths, breakpoints; Shell expands on desktop
  - Verification: `npm run build` passes; manual check at 320/768/1024/1440px

- [ ] **Task 2**: Create reusable UI components (Button, Input, Select, Card, Modal, Toast)
  - Acceptance: Component library in `src/components/ui/` with consistent styling
  - Verification: Storybook or manual render test

- [ ] **Task 3**: Refactor AppShell for responsive layout (sidebar on desktop, bottom nav on mobile)
  - Acceptance: Desktop shows sidebar navigation; mobile shows bottom bar
  - Verification: Manual test at breakpoints

### Phase 2: Link-Based Invitations

- [ ] **Task 4**: Add `inviteSlug` to `householdInvites` table (migration)
  - Acceptance: Migration generated and applied; slug is unique, URL-safe
  - Verification: `npm run db:generate` + `npm run db:migrate`; `drizzle-kit check`

- [ ] **Task 5**: Create `/family/join/[slug]` page for link-based joining
  - Acceptance: GET shows preview; POST joins household; invalid/expired slugs handled
  - Verification: Manual test with valid/invalid/expired links

- [ ] **Task 6**: Update Family page to generate shareable links instead of codes
  - Acceptance: "Einladen" button copies link to clipboard; shows QR code option
  - Verification: Manual test on desktop/mobile

### Phase 3: Camera-First Photo Capture

- [ ] **Task 7**: Create `PhotoCapture` component (camera + file fallback, preview, retake)
  - Acceptance: Opens camera on mobile; file picker on desktop; shows preview before confirm
  - Verification: Manual test on iOS Safari, Chrome Android, Desktop

- [ ] **Task 8**: Integrate `PhotoCapture` into `/wardrobe/new` (replace file input)
  - Acceptance: Primary action is "Foto aufnehmen"; fallback "Datei wählen"
  - Verification: End-to-end create item with photo

### Phase 4: Secondary Upload in Detail View

- [ ] **Task 9**: Redesign "Foto hinzufügen" section in `/wardrobe/[id]` - less prominent
  - Acceptance: Collapsed by default; expands on click; uses `PhotoCapture` component
  - Verification: Manual test - less visual weight than main content

### Phase 5: Multi-File Upload Wizard

- [ ] **Task 10**: Create client-side wizard state machine (`usePhotoWizard` hook)
  - Acceptance: Manages queue of photos; current step (capture → form → next); localStorage persistence
  - Verification: Unit test for hook; manual flow test

- [ ] **Task 11**: Create `/wardrobe/new/wizard` page (or enhance `/wardrobe/new`)
  - Acceptance: Sequential: camera → form per photo → "Weiter" → review → "Alle speichern"
  - Verification: Manual test with 3+ photos

- [ ] **Task 12**: Server action `createItemsBatch` for atomic multi-item creation
  - Acceptance: Takes array of item drafts + photos; creates all in transaction; returns IDs
  - Verification: Integration test; manual wizard completion

### Phase 6: Abbruch-Recovery via Notifications

- [ ] **Task 13**: Add `draftRecovery` notification type with JSON data field
  - Acceptance: Migration for `notifications.data` JSONB column; type enum extended
  - Verification: `drizzle-kit generate` + migrate; check schema

- [ ] **Task 14**: Persist wizard draft to localStorage on every step; create recovery notification on abandon
  - Acceptance: Closing tab/browser during wizard → notification appears with "Fortsetzen" link
  - Verification: Manual test - start wizard, close tab, reopen, click notification

- [ ] **Task 15**: `/wardrobe/new?draft=<id>` restores wizard state from notification
  - Acceptance: Loads draft data; pre-fills forms; continues from last step
  - Verification: Manual test recovery flow

### Phase 7: Polish & Responsive Polish

- [ ] **Task 16**: Desktop layout improvements (grid for wardrobe, wider forms, better use of space)
  - Acceptance: Wardrobe shows 3-col grid on desktop; forms use 2-col layout
  - Verification: Visual review at 1024px+

- [ ] **Task 17**: Accessibility audit (keyboard nav, ARIA, focus management, contrast)
  - Acceptance: No axe-core violations; keyboard accessible; screen reader tested
  - Verification: `npm run test:a11y` or manual axe check

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Camera API not available on all browsers | High | Fallback to file input; detect via `navigator.mediaDevices` |
| localStorage quota exceeded | Medium | Limit draft size; clean up old drafts |
| Multi-photo upload size limits | Medium | Client-side compression; chunked upload if needed |
| Migration complexity for invites | Low | Add slug column alongside token; backfill; switch atomically |

## Open Questions

1. Should the wizard be a separate route (`/wardrobe/new/wizard`) or enhanced `/wardrobe/new`?
2. QR code generation: use a library or external API?
3. Should desktop have a persistent sidebar or just expanded shell?