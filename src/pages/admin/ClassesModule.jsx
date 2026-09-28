import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Layers, Plus, Edit, Trash2, Users, UserCheck, 
  CheckCircle, School, RefreshCw 
} from 'lucide-react';

const ClassesModule = () => {
  const { showToast, refreshSchoolData } = useSchool();
  const [classesList, setClassesList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Primary 1',
    arm: 'Gold',
    numeric_level: 1,
    capacity: 35,
    class_teacher_id: '',
  });

  const fetchClassesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch classes with class teacher and student counts
      const { data: clsData, error: cErr } = await supabase
        .from('classes')
        .select(`
          *,
          teachers:class_teacher_id (id, full_name, staff_id, phone),
          students (id)
        `)
        .order('numeric_level');

      if (cErr) throw cErr;
      setClassesList(clsData || []);

      // 2. Fetch teachers for class teacher assignment
      const { data: tData } = await supabase.from('teachers').select('id, full_name, staff_id');
      setTeachers(tData || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      showToast('Error loading classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      name: 'Primary 1',
      arm: 'Gold',
      numeric_level: 1,
      capacity: 35,
      class_teacher_id: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      arm: cls.arm,
      numeric_level: cls.numeric_level,
      capacity: cls.capacity || 35,
      class_teacher_id: cls.class_teacher_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            arm: formData.arm,
            numeric_level: Number(formData.numeric_level),
            capacity: Number(formData.capacity),
            class_teacher_id: formData.class_teacher_id || null,
          })
          .eq('id', editingClass.id);
        if (error) throw error;
        showToast('Class updated successfully');
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            name: formData.name,
            arm: formData.arm,
            numeric_level: Number(formData.numeric_level),
            capacity: Number(formData.capacity),
            class_teacher_id: formData.class_teacher_id || null,
          });
        if (error) throw error;
        showToast('New class created');
      }
      setIsModalOpen(false);
      fetchClassesData();
      refreshSchoolData();
    } catch (err) {
      showToast(err.message || 'Error saving class', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"? Warning: check that no enrolled students are in this class.`)) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      showToast('Class deleted');
      fetchClassesData();
      refreshSchoolData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Classes & Arms Management</h1>
          <p className="text-xs text-slate-500">
            School arms, capacity limits, enrolled pupil headcounts, and assigned class teachers
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all w-fit"
        >
          <Plus size={16} />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-blue" />
          <p className="text-xs">Loading class structures...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classesList.map(cls => {
            const studentCount = cls.students?.length || 0;
            const occupancyPct = Math.min(100, Math.round((studentCount / (cls.capacity || 35)) * 100));

            return (
              <div key={cls.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-blue/40 transition-all">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-navy text-brand-amber font-black text-base flex items-center justify-center shadow-md">
                        {cls.numeric_level > 0 ? `P${cls.numeric_level}` : 'N'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{cls.name} {cls.arm}</h3>
                        <span className="text-[11px] text-slate-500 font-medium">Arm: {cls.arm}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-blue"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id, `${cls.name} ${cls.arm}`)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Class Teacher Card */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1 mb-1">
                      <UserCheck size={12} className="text-emerald-500" />
                      <span>Class Teacher</span>
                    </div>
                    {cls.teachers ? (
                      <div>
                        <div className="font-bold text-slate-800">{cls.teachers.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cls.teachers.staff_id} • {cls.teachers.phone}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No class teacher assigned</span>
                    )}
                  </div>

                  {/* Pupil Capacity Progress */}
                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Enrolled Pupils:</span>
                      <span className="font-bold text-slate-900">{studentCount} / {cls.capacity || 35}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-brand-blue'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Numeric Level: {cls.numeric_level}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active Class
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingClass ? 'Edit Class Details' : 'Create New Class / Arm'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Arm / Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gold, Diamond, A"
                    value={formData.arm}
                    onChange={(e) => setFormData({ ...formData, arm: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Level (1-6 for Primary) *</label>
                  <input
                    type="number"
                    required
                    value={formData.numeric_level}
                    onChange={(e) => setFormData({ ...formData, numeric_level: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Classroom Capacity *</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Class Teacher</label>
                <select
                  value={formData.class_teacher_id}
                  onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">No Class Teacher Assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.staff_id})</option>
                  ))}
                </select>
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
                  {saving ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesModule;
