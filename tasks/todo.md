# Task List: UI/UX Overhaul

## Phase 1: Foundation - Responsive Layout & Components

- [x] **Task 1**: Create responsive design tokens and breakpoints in globals.css
- [x] **Task 2**: Create reusable UI components (Button, Input, Select, Card, Modal, Toast, Badge, PhotoCapture)
- [x] **Task 3**: Refactor AppShell for responsive layout (sidebar on desktop, bottom nav on mobile)

### Checkpoint: Foundation
- [x] Tests pass, builds clean
- [x] Responsive layout works at 320/768/1024/1440px

## Phase 2: Link-Based Invitations

- [x] **Task 4**: Add `inviteSlug` to `householdInvites` table (migration)
- [x] **Task 5**: Create `/family/join/[slug]` page for link-based joining
- [x] **Task 6**: Update Family page to generate shareable links instead of codes

### Checkpoint: Invitations
- [x] Link-based join works end-to-end
- [x] Old codes still work (backward compat)

## Phase 3: Camera-First Photo Capture

- [x] **Task 7**: Create `PhotoCapture` component (camera + file fallback, preview, retake)
- [x] **Task 8**: Integrate `PhotoCapture` into `/wardrobe/new` (replace file input)

### Checkpoint: Camera-First
- [x] Camera works on mobile, file picker on desktop
- [x] Item creation with photo works

## Phase 4: Secondary Upload in Detail View

- [x] **Task 9**: Redesign "Foto hinzufügen" section in `/wardrobe/[id]` - less prominent

### Checkpoint: Detail Upload
- [x] Collapsed by default, expands on click
- [x] Uses same PhotoCapture component

## Phase 5: Multi-File Upload Wizard

- [ ] **Task 10**: Create client-side wizard state machine (`usePhotoWizard` hook)
- [ ] **Task 11**: Create `/wardrobe/new/wizard` page (sequential flow)
- [ ] **Task 12**: Server action `createItemsBatch` for atomic multi-item creation

### Checkpoint: Multi-Upload
- [ ] Wizard flow works with 3+ photos
- [ ] All items created atomically

## Phase 6: Abbruch-Recovery via Notifications

- [ ] **Task 13**: Add `draftRecovery` notification type with JSON data field
- [ ] **Task 14**: Persist wizard draft to localStorage; create recovery notification on abandon
- [ ] **Task 15**: `/wardrobe/new?draft=<id>` restores wizard state

### Checkpoint: Recovery
- [ ] Abandoned wizard → notification appears
- [ ] Recovery link restores state

## Phase 7: Polish & Responsive Polish

- [ ] **Task 16**: Desktop layout improvements (grid for wardrobe, wider forms)
- [ ] **Task 17**: Accessibility audit (keyboard nav, ARIA, focus, contrast)

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Ready for review