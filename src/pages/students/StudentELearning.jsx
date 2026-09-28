import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Download, FileText, Video, ExternalLink } from 'lucide-react';

const StudentELearning = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from('elearning_resources')
        .select('*, subjects (name, code), classes (name, arm)')
        .order('week_number', { ascending: true });

      setResources(data || []);
      setLoading(false);
    };
    fetchResources();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-brand-navy">E-Learning & Lesson Notes</h1>
        <p className="text-xs text-slate-500">Study materials, uploaded reading notes, and exercises</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(res => (
          <div key={res.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-brand-blue px-2 py-0.5 rounded">
                  Week {res.week_number} • {res.resource_type.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{res.title}</h3>
              <p className="text-slate-500 text-xs mt-1">{res.description || 'Lesson notes and exercises'}</p>
              <div className="text-[11px] text-brand-blue font-semibold mt-2">
                {res.subjects?.name} ({res.subjects?.code})
              </div>
            </div>

            <div className="mt-4 pt-3 border-t">
              <a
                href={res.file_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Download size={14} />
                <span>Open / Download Notes</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentELearning;
