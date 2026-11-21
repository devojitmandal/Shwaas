'use client';

interface AddActivityFormProps {
  name: string;
  onNameChange: (val: string) => void;
  duration: number;
  onDurationChange: (val: number) => void;
  hour: number;
  onHourChange: (val: number) => void;
  type: 'walk' | 'two_wheeler' | 'metro';
  onTypeChange: (val: 'walk' | 'two_wheeler' | 'metro') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddActivityForm({
  name,
  onNameChange,
  duration,
  onDurationChange,
  hour,
  onHourChange,
  type,
  onTypeChange,
  onSubmit,
}: AddActivityFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3.5 text-sm"
    >
      <div className="sm:col-span-2">
        <label htmlFor="new-act-name" className="block text-xs font-semibold uppercase tracking-[0.04em] text-slate-700 mb-1.5">
          Activity Name
        </label>
        <input
          id="new-act-name"
          type="text"
          placeholder="e.g. Afternoon School Run"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-700"
          required
        />
      </div>
      <div>
        <label htmlFor="new-act-duration" className="block text-xs font-semibold uppercase tracking-[0.04em] text-slate-700 mb-1.5">
          Duration (Mins)
        </label>
        <input
          id="new-act-duration"
          type="number"
          min="5"
          max="300"
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value) || 15)}
          className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-700"
        />
      </div>
      <div>
        <label htmlFor="new-act-type" className="block text-xs font-semibold uppercase tracking-[0.04em] text-slate-700 mb-1.5">
          Mode / Type
        </label>
        <select
          id="new-act-type"
          value={type}
          onChange={(e) => onTypeChange(e.target.value as 'walk' | 'two_wheeler' | 'metro')}
          className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <option value="walk">Walking / Jogging</option>
          <option value="two_wheeler">Two-Wheeler / Bike</option>
          <option value="metro">Metro / Closed Bus</option>
        </select>
      </div>
      <div>
        <label htmlFor="new-act-hour" className="block text-xs font-semibold uppercase tracking-[0.04em] text-slate-700 mb-1.5">
          Time Window
        </label>
        <select
          id="new-act-hour"
          value={hour}
          onChange={(e) => onHourChange(parseInt(e.target.value) || 13)}
          className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <option value="8">Morning (08:00 AM)</option>
          <option value="13">Afternoon (01:00 PM - Cleaner)</option>
          <option value="18">Evening (06:00 PM)</option>
          <option value="21">Night (09:00 PM)</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full min-h-[44px] px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-semibold focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          Add Activity
        </button>
      </div>
    </form>
  );
}
