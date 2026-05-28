export const NOTIFICATION_PERMISSION_KEY = "life-rpg-notification-permission";

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
  return permission;
}

export function notifyHabitReminder(title: string, body: string): void {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  new Notification(title, { body });
}
