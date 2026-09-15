---
name: sm-dialog-auto-close
description: Fix Security Management list dialogs that flash open then close on /:id routes. Use when SM modal auto-closes, double-toggle on uw-authority-limits/:id, positions/:id, or user-positions/:id.
---

# SM dialog auto-close

## Symptom

- URL like `/security-management/uw-authority-limits/9` opens the edit modal then it closes immediately.
- Double-click row sometimes toggles the dialog closed.

## Cause

`toggleDialog(id)` flips `visible`. Opening the same record twice (route mount + `handleDetail`) runs open then toggle-close.

## Fix pattern

1. Use **`openDetail(id)`** for deep links and row open (never toggle to open).
2. Use **`toggleDialog()`** without id only for **New** and **after save** close.
3. On mount: `handlePageUrl()` → `openDetail(route.params.id)` if id present and dialog closed.
4. `watch(route.params.id)` to open on client navigation, close when id cleared.
5. `handleClose()` sets `visible = false` (do not toggle).
6. `smIndexHandlers.handleDetail` must call `openDetail`, not `toggleDialog`.

## Shared code

- Composable: `resources/js/views/SecurityManagement/utils/useSmRecordDialog.js`
- Index handler: `resources/js/views/SecurityManagement/utils/smIndexHandlers.js` (`openDetail` branch)
- Validation (Business Channel Commission style): `smFormValidation.js` + `smApiErrorMessage.js` — inline field errors, no generic toast on validation

## Checklist

- [ ] `defineExpose({ toggleDialog, openDetail })`
- [ ] `onMounted` → `handlePageUrl()` after `nextTick`
- [ ] No `openFromRoute` that sets `visible` while `handleDetail` also toggles
- [ ] Rebuild: `npm run vite-build` and hard refresh

## Do not

- Call `toggleDialog(rowId)` from `handleDetail` when the dialog may already be opening from the route.
