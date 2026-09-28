import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { Calendar, Printer } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { number: 1, start: '08:30', end: '09:15', label: 'Period 1' },
  { number: 2, start: '09:15', end: '10:00', label: 'Period 2' },
  { number: 3, start: '10:30', end: '11:15', label: 'Period 3' },
  { number: 4, start: '11:15', end: '12:00', label: 'Period 4' },
  { number: 5, start: '12:30', end: '13:15', label: 'Period 5' },
];

const StudentTimetable = () => {
  const { school } = useSchool();
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const fetchTimetable = async () => {
      const { data } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          subjects (name, code),
          teachers (full_name)
        `);
      setSlots(data || []);
    };
    fetchTimetable();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Class Weekly Timetable</h1>
          <p className="text-xs text-slate-500">Official schedule of subjects, class periods and teachers</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
        >
          <Printer size={15} />
          <span>Print Timetable</span>
        </button>
      </div>

      <div className="printable-area bg-white rounded-2xl shadow-card border border-slate-200 p-6 overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="bg-brand-navy text-white text-center uppercase text-[10px]">
              <th className="p-3 border border-slate-700 w-28">Day</th>
              {PERIODS.map(p => (
                <th key={p.number} className="p-3 border border-slate-700">
                  <div>{p.label}</div>
                  <div className="text-[10px] text-slate-300 font-mono">{p.start} - {p.end}</div>
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
                {PERIODS.map(p => {
                  const slot = slots.find(s => s.day_of_week === day && s.period_number === p.number);

                  return (
                    <td key={p.number} className="p-2 border border-slate-200 align-top">
                      {slot ? (
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-left">
                          <div className="font-bold text-brand-navy">{slot.subjects?.name}</div>
                          <div className="text-[10px] text-brand-blue font-semibold">{slot.teachers?.full_name || 'Subject Teacher'}</div>
                          <div className="text-[10px] text-slate-400">{slot.room || 'Classroom'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px] italic">Free Period</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTimetable;
