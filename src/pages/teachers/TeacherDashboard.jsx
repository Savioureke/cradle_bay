import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { supabase } from '../../lib/supabase';
import { 
  CheckSquare, Award, BookOpen, Calendar, MessageSquare, 
  Clock, ArrowUpRight, CheckCircle2 
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { activeSession, activeTerm } = useSchool();
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      // Fetch teacher assignments
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select(`
          classes (id, name, arm),
          subjects (id, name, code)
        `);

      setAssignedClasses(assignments || []);

      // Fetch today's schedule
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = dayNames[new Date().getDay()] || 'Monday';

      const { data: slots } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          classes (name, arm),
          subjects (name, code)
        `)
        .eq('day_of_week', today === 'Sunday' || today === 'Saturday' ? 'Monday' : today)
        .order('period_number');

      setTodaySchedule(slots || []);
    };

    fetchTeacherDetails();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-500/30">
          <span>Academic Staff Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Welcome back, {user?.full_name || 'Teacher'}
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">
          {activeSession.name} • {activeTerm.name}. Mark daily class attendance, enter assessment scores, and upload e-learning resources.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link
            to="/teachers/attendance"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            Mark Daily Register
          </Link>
          <Link
            to="/teachers/exams"
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold shadow-lg shadow-brand-blue/30 transition-all"
          >
            Score Sheets & CBT
          </Link>
          <Link
            to="/teachers/elearning"
            className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-xl font-bold transition-all"
          >
            Upload Notes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Calendar size={18} className="text-brand-blue" />
              <span>Teaching Periods for Today</span>
            </h3>
            <Link to="/teachers/timetable" className="text-xs font-bold text-brand-blue hover:underline">
              Full Schedule
            </Link>
          </div>

          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No periods scheduled for today.</div>
            ) : (
              todaySchedule.map(slot => (
                <div key={slot.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue font-bold flex items-center justify-center text-xs">
                      P{slot.period_number}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{slot.subjects?.name} ({slot.subjects?.code})</div>
                      <div className="text-[11px] text-slate-500">{slot.classes?.name} {slot.classes?.arm} • {slot.room || 'Classroom'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-slate-700">{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">Scheduled</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Classes */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">My Teaching Allocations</h3>
          <div className="space-y-2">
            {assignedClasses.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{item.classes?.name} {item.classes?.arm}</div>
                  <div className="text-[11px] text-brand-blue font-semibold">{item.subjects?.name}</div>
                </div>
                <Link
                  to="/teachers/attendance"
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-brand-blue rounded-lg text-[11px] font-bold text-slate-700"
                >
                  Register
                </Link>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t text-xs">
            <Link to="/teachers/leave" className="text-slate-600 hover:text-slate-900 font-medium flex items-center justify-between">
              <span>Need time off? Apply for staff leave</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
