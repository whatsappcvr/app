// FCM's messageId isn't reliable for de-duping the on-screen banner: it can
// redeliver the same push with a new messageId (at-least-once delivery), and
// the id fallback used to be Date.now() which is different on every call.
// Deriving the notifee id from content instead means a redelivered/duplicate
// push replaces the existing tray notification instead of adding a second
// one — the same dedup rule the notifications store already applies to its
// persisted list (see notificationSignature in store.ts).
export function contentNotificationId(data: Record<string, string> | undefined): string {
  const key = `${data?.type ?? 'general'}|${data?.title ?? ''}|${data?.body ?? ''}`
  let hash = 5381
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0
  }
  return `push-${Math.abs(hash)}`
}
