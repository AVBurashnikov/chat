const NOTIFICATION_ICON = '/android-chrome-192x192.png';

export const isBrowserNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const requestBrowserNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Notification permission error:', error);
    return 'denied';
  }
};

export const showBrowserNotification = ({ title, body, tag, data }) => {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    body,
    tag,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    data,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
};
