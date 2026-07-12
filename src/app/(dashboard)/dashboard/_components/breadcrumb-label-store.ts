"use client";

/**
 * Tiny external store letting a detail page (server-rendered, already
 * knows the record's name) tell the breadcrumb trail what to show instead
 * of the raw route id. Keyed by pathname so a stale label never leaks onto
 * a different route during client navigation.
 */
type Snapshot = { path: string; label: string } | null;

let snapshot: Snapshot = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setBreadcrumbLabel(path: string, label: string) {
  snapshot = { path, label };
  emit();
}

export function clearBreadcrumbLabel(path: string) {
  if (snapshot?.path === path) {
    snapshot = null;
    emit();
  }
}

export function subscribeBreadcrumbLabel(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBreadcrumbLabelSnapshot() {
  return snapshot;
}
