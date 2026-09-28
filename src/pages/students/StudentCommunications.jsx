import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

const StudentCommunications = () => {
  const { user, activeWard, isParent } = useAuth();
  const { showToast } = useSchool();
  const [logs, setLogs] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const studentId = isParent ? activeWard?.id : (user?.student_id || user?.id);

  const fetchCommunications = async () => {
    try {
      const { data } = await supabase
        .from('communication_logs')
        .select('*, profiles:sender_id (full_name, role)')
        .order('created_at', { ascending: false });

      setLogs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [studentId]);

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!newSubject || !newMessage || !studentId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('communication_logs').insert({
        student_id: studentId,
        sender_id: user?.id || 'demo-parent-001',
        category: 'General',
        subject: newSubject,
        message: newMessage,
      });

      if (error) throw error;
      showToast('Message sent to class teacher and school office');
      setNewSubject('');
      setNewMessage('');
      fetchCommunications();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Parent & School Communication Log</h1>
        <p className="text-xs text-slate-500">
          Official exchanges, teacher commendations, behavioral notes, and parent queries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Feed */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Communication Trail</h3>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border text-xs">
              No communication logs yet.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.category === 'Commendation' ? 'bg-emerald-100 text-emerald-800' :
                      log.category === 'Academic' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.category}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{log.subject}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{log.message}"
                </p>

                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>From: <strong>{log.profiles?.full_name || 'Staff Teacher'}</strong></span>
                  <span className="text-emerald-600 font-semibold">Logged</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Send Inquiry to School */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 h-fit space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Send Note to Class Teacher</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inquire about your child's academic or behavioral progress
            </p>
          </div>

          <form onSubmit={handleSendQuery} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. Inquiring on math homework"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Message *</label>
              <textarea
                rows="4"
                required
                placeholder="Write your inquiry or feedback..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Send size={14} />
              <span>{sending ? 'Sending...' : 'Send to Teacher'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentCommunications;
