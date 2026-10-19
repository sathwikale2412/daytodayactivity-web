/**
 * Day to Day Activity - Persistent Database Engine
 * Features:
 * - IndexedDB storage with structured stores (users, tasks, routines, profiles)
 * - Automatic localStorage fallback if IndexedDB is blocked
 * - SHA-256 password hashing with unique per-user salt
 * - Session token persistence
 * - Support for querying tasks by date, date range (analytics), and user isolation
 */

const DB_NAME = 'DayToDayActivityDB';
const DB_VERSION = 1;

class AppDatabase {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        this.useFallback = true;
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Tasks store (mirrors Android Room TaskItem)
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('userId', 'userId', { unique: false });
          taskStore.createIndex('userId_date', ['userId', 'date'], { unique: false });
          taskStore.createIndex('date', 'date', { unique: false });
        }

        // Routine items store (mirrors Android Room RoutineItem)
        if (!db.objectStoreNames.contains('routines')) {
          const routineStore = db.createObjectStore('routines', { keyPath: 'id', autoIncrement: true });
          routineStore.createIndex('userId', 'userId', { unique: false });
        }

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'userId' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        this.useFallback = true;
        resolve(null);
      };
    });
  }

  // --- Crypto Helpers ---
  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ':' + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  generateToken() {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // --- User / Authentication Operations ---
  async createUser({ email, password, name, dailyGoalCount = 5 }) {
    await this.ready;
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const userRecord = {
      email: cleanEmail,
      passwordHash,
      salt,
      name: name.trim() || 'User',
      dailyGoalCount: Number(dailyGoalCount) || 5,
      createdAt: new Date().toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['users', 'profiles', 'routines', 'tasks'], 'readwrite');
        const userStore = tx.objectStore('users');
        const req = userStore.add(userRecord);

        req.onsuccess = () => {
          const userId = req.result;
          userRecord.id = userId;

          // Create initial profile
          const profileStore = tx.objectStore('profiles');
          profileStore.put({
            userId,
            name: userRecord.name,
            dailyGoalCount: userRecord.dailyGoalCount,
            soundEnabled: true,
            notificationsEnabled: true,
            theme: 'dark'
          });

          // Seed default routines
          const routineStore = tx.objectStore('routines');
          const defaultRoutines = [
            { userId, title: 'Morning Exercise & Meditation', startTimeHour: 7, startTimeMinute: 0, endTimeHour: 8, endTimeMinute: 0, category: 'Health' },
            { userId, title: 'Deep Work Session 1', startTimeHour: 9, startTimeMinute: 30, endTimeHour: 12, endTimeMinute: 0, category: 'Work' },
            { userId, title: 'Healthy Lunch & Walk', startTimeHour: 12, startTimeMinute: 30, endTimeHour: 13, endTimeMinute: 30, category: 'Health' },
            { userId, title: 'Project Focus & Code Review', startTimeHour: 14, startTimeMinute: 0, endTimeHour: 17, endTimeMinute: 0, category: 'Work' },
            { userId, title: 'Evening Reading & Reflection', startTimeHour: 20, startTimeMinute: 30, endTimeHour: 21, endTimeMinute: 30, category: 'Personal' }
          ];
          defaultRoutines.forEach(r => routineStore.add(r));

          // Seed sample tasks for today
          const todayStr = new Date().toISOString().split('T')[0];
          const taskStore = tx.objectStore('tasks');
          const now = new Date();
          const currentHour = now.getHours();

          const sampleTasks = [
            {
              userId,
              title: 'Review Daily Priorities',
              description: 'Check today’s planned routines and set focus goals',
              startTime: new Date().setHours(Math.max(0, currentHour - 1), 0, 0, 0),
              endTime: new Date().setHours(Math.max(1, currentHour), 0, 0, 0),
              isCompleted: true,
              date: todayStr,
              category: 'Routine'
            },
            {
              userId,
              title: 'Active Focus Milestone',
              description: 'Work on key project deliverables and inspect results',
              startTime: new Date().setHours(currentHour, 0, 0, 0),
              endTime: new Date().setHours(currentHour + 1, 30, 0, 0),
              isCompleted: false,
              date: todayStr,
              category: 'Work'
            },
            {
              userId,
              title: 'Day Wrap-up & Tomorrow Planning',
              description: 'Reflect on accomplishments and review consistency analytics',
              startTime: new Date().setHours(21, 0, 0, 0),
              endTime: new Date().setHours(22, 0, 0, 0),
              isCompleted: false,
              date: todayStr,
              category: 'Personal'
            }
          ];
          sampleTasks.forEach(t => taskStore.add(t));
        };

        tx.oncomplete = () => {
          resolve(this.sanitizeUser(userRecord));
        };

        tx.onerror = () => reject(tx.error);
      });
    } else {
      // LocalStorage fallback
      const users = this.getLS('users', []);
      userRecord.id = Date.now();
      users.push(userRecord);
      this.setLS('users', users);
      return this.sanitizeUser(userRecord);
    }
  }

  async authenticateUser(email, password) {
    await this.ready;
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.getUserByEmail(cleanEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const computedHash = await this.hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken();
    const session = {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: Date.now()
    };
    localStorage.setItem('daytoday_session', JSON.stringify(session));

    return { user: this.sanitizeUser(user), token };
  }

  async getUserByEmail(email) {
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('users', 'readonly');
        const index = tx.objectStore('users').index('email');
        const req = index.get(email);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else {
      const users = this.getLS('users', []);
      return users.find(u => u.email === email) || null;
    }
  }

  async getUserById(id) {
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('users', 'readonly');
        const req = tx.objectStore('users').get(Number(id));
        req.onsuccess = () => resolve(req.result ? this.sanitizeUser(req.result) : null);
        req.onerror = () => resolve(null);
      });
    } else {
      const users = this.getLS('users', []);
      const user = users.find(u => u.id === Number(id));
      return user ? this.sanitizeUser(user) : null;
    }
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // --- Profile Operations ---
  async getProfile(userId) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('profiles', 'readonly');
        const req = tx.objectStore('profiles').get(Number(userId));
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            resolve({ userId, name: 'User', dailyGoalCount: 5, soundEnabled: true, notificationsEnabled: true, theme: 'dark' });
          }
        };
        req.onerror = () => resolve({ userId, name: 'User', dailyGoalCount: 5, soundEnabled: true, notificationsEnabled: true, theme: 'dark' });
      });
    } else {
      const profiles = this.getLS('profiles', {});
      return profiles[userId] || { userId, name: 'User', dailyGoalCount: 5, soundEnabled: true, notificationsEnabled: true, theme: 'dark' };
    }
  }

  async updateProfile(userId, profileData) {
    await this.ready;
    const current = await this.getProfile(userId);
    const updated = { ...current, ...profileData, userId: Number(userId) };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(['profiles', 'users'], 'readwrite');
        tx.objectStore('profiles').put(updated);

        // Also update name / goal in user record if modified
        const userStore = tx.objectStore('users');
        const getReq = userStore.get(Number(userId));
        getReq.onsuccess = () => {
          if (getReq.result) {
            const user = getReq.result;
            if (profileData.name) user.name = profileData.name;
            if (profileData.dailyGoalCount) user.dailyGoalCount = profileData.dailyGoalCount;
            userStore.put(user);
          }
        };

        tx.oncomplete = () => resolve(updated);
        tx.onerror = () => reject(tx.error);
      });
    } else {
      const profiles = this.getLS('profiles', {});
      profiles[userId] = updated;
      this.setLS('profiles', profiles);
      return updated;
    }
  }

  // --- Tasks Operations ---
  async getTasks(userId, dateStr = null) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('tasks', 'readonly');
        const store = tx.objectStore('tasks');
        const index = store.index('userId');
        const req = index.getAll(Number(userId));

        req.onsuccess = () => {
          let tasks = req.result || [];
          if (dateStr) {
            tasks = tasks.filter(t => t.date === dateStr);
          }
          // Sort by startTime ascending
          tasks.sort((a, b) => a.startTime - b.startTime);
          resolve(tasks);
        };

        req.onerror = () => resolve([]);
      });
    } else {
      let tasks = this.getLS('tasks', []).filter(t => t.userId === Number(userId));
      if (dateStr) {
        tasks = tasks.filter(t => t.date === dateStr);
      }
      tasks.sort((a, b) => a.startTime - b.startTime);
      return tasks;
    }
  }

  async getAllTasksForUser(userId) {
    return this.getTasks(userId, null);
  }

  async addTask(task) {
    await this.ready;
    const item = {
      ...task,
      userId: Number(task.userId),
      startTime: Number(task.startTime),
      endTime: Number(task.endTime),
      isCompleted: Boolean(task.isCompleted),
      date: task.date || new Date().toISOString().split('T')[0],
      category: task.category || 'General',
      createdAt: Date.now()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('tasks', 'readwrite');
        const req = tx.objectStore('tasks').add(item);
        req.onsuccess = () => {
          item.id = req.result;
          resolve(item);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const tasks = this.getLS('tasks', []);
      item.id = Date.now();
      tasks.push(item);
      this.setLS('tasks', tasks);
      return item;
    }
  }

  async updateTask(task) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('tasks', 'readwrite');
        const req = tx.objectStore('tasks').put(task);
        req.onsuccess = () => resolve(task);
        req.onerror = () => reject(req.error);
      });
    } else {
      let tasks = this.getLS('tasks', []);
      tasks = tasks.map(t => (t.id === task.id ? { ...t, ...task } : t));
      this.setLS('tasks', tasks);
      return task;
    }
  }

  async deleteTask(taskId) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('tasks', 'readwrite');
        const req = tx.objectStore('tasks').delete(Number(taskId));
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      let tasks = this.getLS('tasks', []);
      tasks = tasks.filter(t => t.id !== Number(taskId));
      this.setLS('tasks', tasks);
      return true;
    }
  }

  // --- Routine Operations ---
  async getRoutines(userId) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction('routines', 'readonly');
        const index = tx.objectStore('routines').index('userId');
        const req = index.getAll(Number(userId));

        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => {
            const timeA = a.startTimeHour * 60 + a.startTimeMinute;
            const timeB = b.startTimeHour * 60 + b.startTimeMinute;
            return timeA - timeB;
          });
          resolve(list);
        };

        req.onerror = () => resolve([]);
      });
    } else {
      const routines = this.getLS('routines', []).filter(r => r.userId === Number(userId));
      routines.sort((a, b) => (a.startTimeHour * 60 + a.startTimeMinute) - (b.startTimeHour * 60 + b.startTimeMinute));
      return routines;
    }
  }

  async addRoutine(routine) {
    await this.ready;
    const item = {
      ...routine,
      userId: Number(routine.userId),
      startTimeHour: Number(routine.startTimeHour),
      startTimeMinute: Number(routine.startTimeMinute),
      endTimeHour: Number(routine.endTimeHour),
      endTimeMinute: Number(routine.endTimeMinute),
      category: routine.category || 'General'
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('routines', 'readwrite');
        const req = tx.objectStore('routines').add(item);
        req.onsuccess = () => {
          item.id = req.result;
          resolve(item);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const routines = this.getLS('routines', []);
      item.id = Date.now();
      routines.push(item);
      this.setLS('routines', routines);
      return item;
    }
  }

  async deleteRoutine(routineId) {
    await this.ready;
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction('routines', 'readwrite');
        const req = tx.objectStore('routines').delete(Number(routineId));
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      let routines = this.getLS('routines', []);
      routines = routines.filter(r => r.id !== Number(routineId));
      this.setLS('routines', routines);
      return true;
    }
  }

  // --- Analytics Helper ---
  async getWeeklyAnalytics(userId) {
    const allTasks = await this.getAllTasksForUser(userId);
    const today = new Date();
    const days = [];

    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = allTasks.filter(t => t.date === dateStr);
      const completed = dayTasks.filter(t => t.isCompleted).length;
      const total = dayTasks.length;
      const rate = total > 0 ? (completed / total) : 0;

      days.push({
        date: dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        formattedDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        completed,
        total,
        rate: Math.round(rate * 100)
      });
    }

    const totalCreated = allTasks.length;
    const totalCompleted = allTasks.filter(t => t.isCompleted).length;
    const overallRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    return {
      days,
      totalCreated,
      totalCompleted,
      overallRate
    };
  }

  // --- LocalStorage Fallback Helpers ---
  getLS(key, defaultValue) {
    try {
      const val = localStorage.getItem('daytoday_' + key);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setLS(key, value) {
    try {
      localStorage.setItem('daytoday_' + key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // --- Full Backup / Export ---
  async exportData(userId) {
    const profile = await this.getProfile(userId);
    const tasks = await this.getAllTasksForUser(userId);
    const routines = await this.getRoutines(userId);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      tasks,
      routines
    };
  }

  async importData(userId, data) {
    if (!data || !data.version) {
      throw new Error('Invalid backup file format');
    }

    if (data.profile) {
      await this.updateProfile(userId, data.profile);
    }

    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        const { id, ...taskData } = t;
        await this.addTask({ ...taskData, userId });
      }
    }

    if (Array.isArray(data.routines)) {
      for (const r of data.routines) {
        const { id, ...routineData } = r;
        await this.addRoutine({ ...routineData, userId });
      }
    }

    return true;
  }
}

export const db = new AppDatabase();
