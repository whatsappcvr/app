import notifee, { AndroidImportance } from '@notifee/react-native'

// Called both from the foreground registration flow and from the
// background message handler (index.js) — a background push can be the
// very first thing to run after a cold start, before any React code, so
// the channel needs to exist before that path tries to display anything
// too. notifee.createChannel is a no-op if the channel already exists.
export async function ensureDefaultChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'default',
    name: 'Default',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [250, 250, 250, 250],
  })
}
