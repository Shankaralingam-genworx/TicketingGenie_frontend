/**
 * lib/sessionEvents.ts
 * Tiny event bus that lets fetchClient signal session expiry to the UI
 * without creating circular imports (fetchClient → store → slice → fetchClient).
 *
 * Usage:
 *   // In fetchClient: fire the event
 *   sessionEvents.emit('expired');
 *
 *   // In a component/hook: listen for it
 *   useEffect(() => sessionEvents.on('expired', handler), []);
 */

type SessionEvent = 'expired';

type Handler = () => void;

const listeners = new Map<SessionEvent, Set<Handler>>();

export const sessionEvents = {
  emit(event: SessionEvent) {
    listeners.get(event)?.forEach((h) => h());
  },
  on(event: SessionEvent, handler: Handler): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  },
};
