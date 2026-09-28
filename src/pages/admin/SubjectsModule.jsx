import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  BookOpen, Plus, Search, Edit, Trash2, CheckCircle2, 
  Layers, Check, X, RefreshCw 
} from 'lucide-react';

const SubjectsModule = () => {
  const { classes, showToast } = useSchool();
  const [subjects, setSubjects] = useState([]);
  const [curriculumMappings, setCurriculumMappings] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_core: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: subData, error: sErr } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      if (sErr) throw sErr;
      setSubjects(subData || []);

      const { data: mapData, error: mErr } = await supabase
        .from('class_subjects')
        .select('*');
      if (mErr) throw mErr;
      setCurriculumMappings(mapData || []);

      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      showToast('Error loading subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classes]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({ code: '', name: '', description: '', is_core: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      description: sub.description || '',
      is_core: sub.is_core,
    });
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            code: formData.code.toUpperCase().trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            is_core: formData.is_core,
          })
          .eq('id', editingSubject.id);
        if (error) throw error;
        showToast('Subject updated successfully');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({
            code: formData.code.toUpperCase().trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            is_core: formData.is_core,
          });
        if (error) throw error;
        showToast('New subject added to curriculum');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Error saving subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}" from curriculum?`)) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      showToast('Subject deleted');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle curriculum mapping for selected class
  const handleToggleClassSubject = async (subjectId) => {
    if (!selectedClassId) return;

    const existing = curriculumMappings.find(
      m => m.class_id === selectedClassId && m.subject_id === subjectId
    );

    try {
      if (existing) {
        // Remove mapping
        const { error } = await supabase
          .from('class_subjects')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        showToast('Subject removed from class curriculum');
      } else {
        // Add mapping
        const { error } = await supabase
          .from('class_subjects')
          .insert({
            class_id: selectedClassId,
            subject_id: subjectId,
            is_compulsory: true,
            periods_per_week: 4,
          });
        if (error) throw error;
        showToast('Subject added to class curriculum');
      }
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredSubjects = subjects.filter(s =>
    `${s.name} ${s.code} ${s.description}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Subjects & Curriculum Mapping</h1>
          <p className="text-xs text-slate-500">
            School subject registry and class-level curriculum allocations
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all w-fit"
        >
          <Plus size={16} />
          <span>Add New Subject</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subjects Registry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <button onClick={fetchData} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Registered School Subjects</span>
              <span className="text-xs text-slate-400">{filteredSubjects.length} Total</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {filteredSubjects.map(sub => (
                <div key={sub.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-soft/60 text-brand-blue font-black flex items-center justify-center text-xs">
                      {sub.code}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                        <span>{sub.name}</span>
                        {sub.is_core && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{sub.description || 'Primary School Curriculum'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-blue"
                      title="Edit Subject"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id, sub.name)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                      title="Delete Subject"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Class Curriculum Mapping Matrix */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Layers size={18} className="text-brand-blue" />
              <h2 className="font-bold text-slate-900 text-sm">Class Curriculum Allocation</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select a class below to toggle which subjects are active in that class's term curriculum:
            </p>

            {/* Class Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-5">
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

            {/* Subject Checkboxes for active class */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {subjects.map(s => {
                const isMapped = curriculumMappings.some(
                  m => m.class_id === selectedClassId && m.subject_id === s.id
                );

                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleClassSubject(s.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isMapped ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {isMapped && <Check size={14} />}
                      </div>
                      <span className={`font-semibold ${isMapped ? 'text-slate-900' : 'text-slate-500'}`}>
                        {s.name} ({s.code})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isMapped ? 'Active' : 'Not in Class'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Curriculum Note:</strong> Changes here automatically configure timetable generation and exam score sheets for {activeClass?.name} {activeClass?.arm}.
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MTH"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Syllabus</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Arithmetic, number reasoning and geometry"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_core"
                  checked={formData.is_core}
                  onChange={(e) => setFormData({ ...formData, is_core: e.target.checked })}
                  className="rounded text-brand-blue focus:ring-brand-blue"
                />
                <label htmlFor="is_core" className="font-semibold text-slate-700">
                  Core Compulsory Primary Subject
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl font-bold"
                >
                  {saving ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsModule;
