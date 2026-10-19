import React, { useState } from 'react';
import { X, Clock, Calendar, Tag, FileText, Check } from 'lucide-react';
import { todayStr } from '../lib/date';

export default function AddTaskModal({ isOpen, onClose, onAddTask, defaultDate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || todayStr());
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [category, setCategory] = useState('General');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Convert date + HH:mm to epoch milliseconds
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
    const endDate = new Date(year, month - 1, day, endH, endM, 0, 0);

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime: startDate.getTime(),
      endTime: endDate.getTime(),
      category,
      isCompleted: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-dark-surface/95 border border-white/15 p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Add New Task</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Design Wireframes, Workout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Add key notes, links, or checklist"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Routine">Routine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Start Time (HH:mm)</label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">End Time (HH:mm)</label>
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-glow-blue transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
