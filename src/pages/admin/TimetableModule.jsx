import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Calendar, Plus, Clock, AlertCircle, CheckCircle, 
  Trash2, Printer, Sparkles, RefreshCw 
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { number: 1, start: '08:30', end: '09:15', label: 'Period 1' },
  { number: 2, start: '09:15', end: '10:00', label: 'Period 2' },
  { number: 3, start: '10:30', end: '11:15', label: 'Period 3' },
  { number: 4, start: '11:15', end: '12:00', label: 'Period 4' },
  { number: 5, start: '12:30', end: '13:15', label: 'Period 5' },
];

const TimetableModule = () => {
  const { classes, subjects, activeTerm, showToast } = useSchool();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Slot modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotPeriod, setSlotPeriod] = useState(1);
  const [slotSubjectId, setSlotSubjectId] = useState('');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotRoom, setSlotRoom] = useState('Room 1A');

  const fetchTimetableData = async () => {
    setLoading(true);
    try {
      const { data: slotData, error: sErr } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          subjects (id, name, code),
          teachers (id, full_name, staff_id)
        `);
      if (sErr) throw sErr;
      setSlots(slotData || []);

      const { data: tData } = await supabase.from('teachers').select('id, full_name, staff_id');
      setTeachers(tData || []);

      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
      showToast('Error loading timetable data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [classes]);

  // Handle manual slot assignment with clash detection
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !slotSubjectId || !activeTerm.id) return;

    // CLASH DETECTION CHECK 1: Teacher conflict (teacher already in another class at this day + period)
    if (slotTeacherId) {
      const teacherClash = slots.find(
        s => s.day_of_week === slotDay &&
             s.period_number === Number(slotPeriod) &&
             s.teacher_id === slotTeacherId &&
             s.class_id !== selectedClassId
      );

      if (teacherClash) {
        showToast(`Teacher conflict! This teacher is already scheduled in another class during ${slotDay} Period ${slotPeriod}`, 'error');
        return;
      }
    }

    const periodDef = PERIODS.find(p => p.number === Number(slotPeriod));

    try {
      // Upsert slot for this class, day, period
      const { error } = await supabase
        .from('timetable_slots')
        .upsert({
          term_id: activeTerm.id,
          class_id: selectedClassId,
          day_of_week: slotDay,
          period_number: Number(slotPeriod),
          start_time: `${periodDef.start}:00`,
          end_time: `${periodDef.end}:00`,
          subject_id: slotSubjectId,
          teacher_id: slotTeacherId || null,
          room: slotRoom
        }, { onConflict: 'term_id, class_id, day_of_week, period_number' });

      if (error) throw error;
      showToast('Timetable period scheduled successfully');
      setIsModalOpen(false);
      fetchTimetableData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const { error } = await supabase.from('timetable_slots').delete().eq('id', slotId);
      if (error) throw error;
      showToast('Period cleared');
      fetchTimetableData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Auto-Generate clash-free schedule assist
  const handleAutoGenerate = async () => {
    if (!selectedClassId || subjects.length === 0 || !activeTerm.id) return;
    if (!window.confirm('Auto-generate clash-free timetable proposal for this class? Existing slots for this class will be regenerated.')) return;

    try {
      // Clear existing for class
      await supabase.from('timetable_slots').delete().eq('class_id', selectedClassId);

      const newSlots = [];
      let subIndex = 0;
      let teacherIndex = 0;

      for (const day of DAYS) {
        for (const period of PERIODS) {
          const sub = subjects[subIndex % subjects.length];
          const teacher = teachers[teacherIndex % (teachers.length || 1)];

          // Check if teacher is busy elsewhere
          const isBusy = slots.some(
            s => s.day_of_week === day && s.period_number === period.number && s.teacher_id === teacher?.id
          );

          newSlots.push({
            term_id: activeTerm.id,
            class_id: selectedClassId,
            day_of_week: day,
            period_number: period.number,
            start_time: `${period.start}:00`,
            end_time: `${period.end}:00`,
            subject_id: sub.id,
            teacher_id: isBusy ? null : teacher?.id,
            room: 'Classroom'
          });

          subIndex++;
          teacherIndex++;
        }
      }

      const { error } = await supabase.from('timetable_slots').insert(newSlots);
      if (error) throw error;
      showToast('Clash-free timetable auto-generated successfully!');
      fetchTimetableData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const classSlots = slots.filter(s => s.class_id === selectedClassId);
  const activeClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Timetable & Schedule Generator</h1>
          <p className="text-xs text-slate-500">
            Manual scheduling with teacher conflict detection and AI auto-generation assist
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Printer size={15} />
            <span>Print Timetable</span>
          </button>
          <button
            onClick={handleAutoGenerate}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl text-xs font-bold shadow-md shadow-brand-amber/30 transition-all"
          >
            <Sparkles size={16} />
            <span>Auto-Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedClassId === c.id
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name} {c.arm}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setSlotSubjectId(subjects[0]?.id || '');
            setSlotTeacherId(teachers[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold"
        >
          <Plus size={14} />
          <span>Add / Edit Period</span>
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="printable-area bg-white rounded-2xl shadow-card border border-slate-200 p-6 overflow-x-auto">
        <div className="text-center mb-6 no-print">
          <h2 className="text-base font-bold text-slate-800">
            Official Weekly Timetable — {activeClass?.name} {activeClass?.arm}
          </h2>
          <p className="text-xs text-slate-500">First Term • 2025/2026 Academic Session</p>
        </div>

        <table className="w-full border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="bg-brand-navy text-white text-center text-[11px] uppercase">
              <th className="p-3 border border-slate-700 w-28">Day / Period</th>
              {PERIODS.map(p => (
                <th key={p.number} className="p-3 border border-slate-700">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-300 font-mono font-normal">{p.start} - {p.end}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} className="text-center">
                <td className="p-3 border border-slate-200 bg-slate-50 font-bold text-slate-800 text-left">
                  {day}
                </td>
                {PERIODS.map(period => {
                  const slot = classSlots.find(
                    s => s.day_of_week === day && s.period_number === period.number
                  );

                  return (
                    <td key={period.number} className="p-2 border border-slate-200 align-top hover:bg-slate-50 transition-colors">
                      {slot ? (
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-left relative group">
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 no-print"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="font-bold text-brand-navy text-xs">
                            {slot.subjects?.name} ({slot.subjects?.code})
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                            Teacher: {slot.teachers?.full_name?.split(' ')[1] || slot.teachers?.full_name || 'Staff'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {slot.room || 'Classroom'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSlotDay(day);
                            setSlotPeriod(period.number);
                            setSlotSubjectId(subjects[0]?.id || '');
                            setSlotTeacherId(teachers[0]?.id || '');
                            setIsModalOpen(true);
                          }}
                          className="w-full h-14 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-colors flex items-center justify-center no-print"
                        >
                          + Add
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Period Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Schedule Timetable Period</h3>
            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Day of Week</label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Period</label>
                  <select
                    value={slotPeriod}
                    onChange={(e) => setSlotPeriod(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {PERIODS.map(p => (
                      <option key={p.number} value={p.number}>{p.label} ({p.start}-{p.end})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject *</label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Teacher</label>
                <select
                  value={slotTeacherId}
                  onChange={(e) => setSlotTeacherId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.staff_id})</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automatic conflict detection prevents double-booking teachers
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue / Room</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder="e.g. Room 1A, Science Lab, ICT Lab"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableModule;
