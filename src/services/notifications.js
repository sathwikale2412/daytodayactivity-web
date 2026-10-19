/**
 * Browser Notification Service
 * Mirrors Android's WorkManager NotificationWorker on the web.
 */

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.notifiedTaskIds = new Set();
    this.checkPermission();
  }

  checkPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    const result = await Notification.requestPermission();
    this.hasPermission = result === 'granted';
    return this.hasPermission;
  }

  notifyTaskStarted(task) {
    if (!this.hasPermission || this.notifiedTaskIds.has(task.id)) {
      return;
    }

    try {
      this.notifiedTaskIds.add(task.id);
      const title = `Task Started: ${task.title}`;
      const options = {
        body: task.description || 'It is time for your scheduled activity!',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `task-${task.id}`,
        renotify: true
      };

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Could not display notification:', e);
    }
  }
}

export const notificationService = new NotificationService();
