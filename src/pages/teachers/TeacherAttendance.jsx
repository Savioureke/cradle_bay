import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { CheckSquare, Save, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

const TeacherAttendance = () => {
  const { classes, activeTerm, showToast } = useSchool();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  const fetchClassStudentsAndAttendance = async () => {
    if (!selectedClassId) return;
    try {
      // 1. Fetch students in class
      const { data: stData } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', selectedClassId)
        .order('last_name');

      setStudents(stData || []);

      // 2. Fetch existing records for this date
      const { data: attData } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('date', attendanceDate);

      const stateMap = {};
      (stData || []).forEach(s => {
        const found = (attData || []).find(a => a.student_id === s.id);
        stateMap[s.id] = {
          status: found?.status || 'present',
          remarks: found?.remarks || ''
        };
      });

      setAttendanceState(stateMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClassStudentsAndAttendance();
  }, [selectedClassId, attendanceDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarkChange = (studentId, remarks) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = {
        ...attendanceState[s.id],
        status
      };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !activeTerm.id) return;
    setSaving(true);
    try {
      const recordsToUpsert = students.map(s => ({
        term_id: activeTerm.id,
        class_id: selectedClassId,
        student_id: s.id,
        date: attendanceDate,
        status: attendanceState[s.id]?.status || 'present',
        remarks: attendanceState[s.id]?.remarks || null
      }));

      const { error } = await supabase
        .from('attendance_records')
        .upsert(recordsToUpsert, { onConflict: 'student_id, date' });

      if (error) throw error;
      showToast('Daily register marked and saved successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Daily Pupil Register</h1>
          <p className="text-xs text-slate-500">
            Quick one-tap attendance marking for pupils in your class
          </p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 w-fit"
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Submit Register'}</span>
        </button>
      </div>

      {/* Selector Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-xl font-semibold"
            />
          </div>
        </div>

        {/* Quick Batch Selectors */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleMarkAll('present')}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Pupils List */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500">
            <tr>
              <th className="py-3 px-4">Pupil</th>
              <th className="py-3 px-3">Admission No</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Remarks / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {students.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">
                  No pupils enrolled in this class.
                </td>
              </tr>
            ) : (
              students.map(s => {
                const currentStatus = attendanceState[s.id]?.status || 'present';

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-blue">
                      {s.admission_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(s.id, 'present')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(s.id, 'late')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(s.id, 'absent')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Optional remark..."
                        value={attendanceState[s.id]?.remarks || ''}
                        onChange={(e) => handleRemarkChange(s.id, e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherAttendance;
