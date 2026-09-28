import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { FileText, Plus, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

const TeacherLeave = () => {
  const { user } = useAuth();
  const { showToast } = useSchool();
  const [leaves, setLeaves] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = async () => {
    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('leave_type', 'staff')
        .order('created_at', { ascending: false });

      setLeaves(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    try {
      const { error } = await supabase.from('leave_requests').insert({
        leave_type: 'staff',
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending'
      });

      if (error) throw error;
      showToast('Staff leave request submitted to admin');
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Staff Leave Applications</h1>
          <p className="text-xs text-slate-500">Apply for medical, annual, or compassionate leave</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          <Plus size={16} />
          <span>Apply for Leave</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {leaves.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No leave applications on file.</div>
        ) : (
          leaves.map(l => (
            <div key={l.id} className="p-5 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {l.start_date} to {l.end_date}
                </div>
                <p className="text-slate-600 mt-1 italic">"{l.reason}"</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Submitted: {new Date(l.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {l.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Staff Leave Application</h3>
            <form onSubmit={handleSubmitLeave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Leave *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detail the reason for requested leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeave;
