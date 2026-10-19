import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  Check, 
  HelpCircle,
  CopyPlus
} from 'lucide-react';
import GlassCard from './GlassCard';

export default function RoutineScreen({
  routineItems,
  currentTime,
  onAddRoutineItem,
  onDeleteRoutineItem,
  onPopulateScheduleFromRoutine,
  onBack
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('09:00');
  const [populatedSuccess, setPopulatedSuccess] = useState(false);

  // Extract current hour & minute from currentTime
  const { currentHour, currentMinute } = useMemo(() => {
    const d = new Date(currentTime);
    return {
      currentHour: d.getHours(),
      currentMinute: d.getMinutes()
    };
  }, [currentTime]);

  // Check if routine item is active right now
  const isRoutineActive = (item) => {
    const currentTotal = currentHour * 60 + currentMinute;
    const startTotal = item.startTimeHour * 60 + item.startTimeMinute;
    const endTotal = item.endTimeHour * 60 + item.endTimeMinute;
    return currentTotal >= startTotal && currentTotal <= endTotal;
  };

  const padZero = (n) => String(n).padStart(2, '0');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const [sH, sM] = newStartTime.split(':').map(Number);
    const [eH, eM] = newEndTime.split(':').map(Number);

    onAddRoutineItem({
      title: newTitle.trim(),
      category: newCategory,
      startTimeHour: isNaN(sH) ? 8 : sH,
      startTimeMinute: isNaN(sM) ? 0 : sM,
      endTimeHour: isNaN(eH) ? 9 : eH,
      endTimeMinute: isNaN(eM) ? 0 : eM
    });

    setNewTitle('');
    setNewStartTime('08:00');
    setNewEndTime('09:00');
    setShowAddModal(false);
  };

  const handlePopulate = async () => {
    if (onPopulateScheduleFromRoutine) {
      await onPopulateScheduleFromRoutine();
      setPopulatedSuccess(true);
      setTimeout(() => setPopulatedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <GlassCard className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scheduler</span>
            </button>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Daily Routine <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-indigo/30 text-purple-300 font-mono">Timetable</span>
          </h2>
          <p className="text-xs md:text-sm text-white/70 mt-1 max-w-xl">
            Consistency is key. Set your recurring daily timetable here. The app automatically highlights your active block in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {routineItems.length > 0 && (
            <button
              onClick={handlePopulate}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs md:text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <CopyPlus className="w-4 h-4 text-accent-teal" />
              <span>{populatedSuccess ? 'Added to Today!' : "Sync to Today's Tasks"}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs md:text-sm shadow-glow-blue transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Routine Item</span>
          </button>
        </div>
      </GlassCard>

      {/* Routine Item Timeline */}
      <div className="space-y-3">
        {routineItems.length === 0 ? (
          <GlassCard className="py-16 text-center">
            <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No routine items yet</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              Add your daily recurring habits, morning routines, or work intervals.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-glow-blue transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Routine Item</span>
            </button>
          </GlassCard>
        ) : (
          routineItems.map((item) => {
            const active = isRoutineActive(item);

            return (
              <GlassCard
                key={item.id}
                className={`transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-secondary-indigo/20 to-primary/20 border-accent-teal/50 shadow-glow-blue' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Left: Routine details */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono text-xs font-bold ${
                      active 
                        ? 'bg-accent-teal text-dark-bg shadow-glow-teal animate-pulse' 
                        : 'bg-white/5 text-white/70 border border-white/10'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base font-semibold text-white">
                          {item.title}
                        </h4>

                        {/* ACTIVE Tag (matching Android RoutineScreen) */}
                        {active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-indigo text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                            ACTIVE
                          </span>
                        )}

                        {item.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-mono">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-white/60 mt-0.5">
                        {padZero(item.startTimeHour)}:{padZero(item.startTimeMinute)} - {padZero(item.endTimeHour)}:{padZero(item.endTimeMinute)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Delete */}
                  <button
                    onClick={() => onDeleteRoutineItem(item)}
                    title="Delete Routine Block"
                    className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Add Routine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-surface/95 border border-white/15 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight">Add Routine Item</h3>
            <p className="text-xs text-white/60">
              Create a recurring activity block for your daily routine.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Workout, Study Block"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="General">General</option>
                  <option value="Health">Health & Fitness</option>
                  <option value="Work">Work & Career</option>
                  <option value="Study">Study & Learning</option>
                  <option value="Personal">Personal & Mindfulness</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Start Time (HH:mm)</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">End Time (HH:mm)</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary font-mono transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-glow-blue transition-colors"
                >
                  Add Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
