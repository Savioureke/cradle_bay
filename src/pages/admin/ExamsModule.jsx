import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../context/SchoolContext';
import { 
  Award, Plus, Search, Edit, Trash2, CheckCircle2, 
  HelpCircle, Play, Layers, Save, RefreshCw 
} from 'lucide-react';

const ExamsModule = () => {
  const { classes, subjects, activeTerm, showToast } = useSchool();
  const [activeTab, setActiveTab] = useState('exams'); // 'exams', 'scoresheet'
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Exam Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examClassId, setExamClassId] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examType, setExamType] = useState('MidTerm');
  const [isCbt, setIsCbt] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(30);

  // CBT Question Builder Modal
  const [selectedExamForCbt, setSelectedExamForCbt] = useState(null);
  const [cbtQuestions, setCbtQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctKey, setCorrectKey] = useState('A');

  // Scoresheet state
  const [scoreClassId, setScoreClassId] = useState('');
  const [scoreSubjectId, setScoreSubjectId] = useState('');
  const [studentsScores, setStudentsScores] = useState([]);
  const [savingScores, setSavingScores] = useState(false);

  const fetchExamsData = async () => {
    setLoading(true);
    try {
      const { data: eData, error: eErr } = await supabase
        .from('exams')
        .select(`
          *,
          classes (name, arm),
          subjects (name, code),
          cbt_questions (id)
        `)
        .order('created_at', { ascending: false });

      if (eErr) throw eErr;
      setExams(eData || []);

      if (classes.length > 0 && !scoreClassId) setScoreClassId(classes[0].id);
      if (subjects.length > 0 && !scoreSubjectId) setScoreSubjectId(subjects[0].id);
    } catch (err) {
      console.error('Error fetching exams:', err);
      showToast('Error loading exams', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, [classes, subjects]);

  // Load scoresheet for selected class & subject
  const loadScoreSheet = async () => {
    if (!scoreClassId || !scoreSubjectId || !activeTerm.id) return;
    try {
      // 1. Fetch all students in class
      const { data: stList } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', scoreClassId)
        .order('last_name');

      // 2. Fetch existing scores
      const { data: scList } = await supabase
        .from('student_scores')
        .select('*')
        .eq('class_id', scoreClassId)
        .eq('subject_id', scoreSubjectId)
        .eq('term_id', activeTerm.id);

      const merged = (stList || []).map(student => {
        const found = (scList || []).find(s => s.student_id === student.id);
        return {
          student_id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          ca1_score: found?.ca1_score ?? 15,
          ca2_score: found?.ca2_score ?? 15,
          exam_score: found?.exam_score ?? 45,
          total: found?.total_score ?? 75,
          grade: found?.grade ?? 'A',
          remark: found?.remark ?? 'Distinction',
        };
      });

      setStudentsScores(merged);
    } catch (err) {
      console.error('Error loading scoresheet:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'scoresheet') {
      loadScoreSheet();
    }
  }, [activeTab, scoreClassId, scoreSubjectId]);

  // Save manual scoresheet
  const handleSaveScoreSheet = async () => {
    setSavingScores(true);
    try {
      const recordsToUpsert = studentsScores.map(s => ({
        student_id: s.student_id,
        term_id: activeTerm.id,
        class_id: scoreClassId,
        subject_id: scoreSubjectId,
        ca1_score: Number(s.ca1_score || 0),
        ca2_score: Number(s.ca2_score || 0),
        exam_score: Number(s.exam_score || 0),
      }));

      const { error } = await supabase
        .from('student_scores')
        .upsert(recordsToUpsert, { onConflict: 'student_id, term_id, subject_id' });

      if (error) throw error;
      showToast('Scores saved and grades computed successfully!');
      loadScoreSheet();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingScores(false);
    }
  };

  // Create Exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examClassId || !examSubjectId || !activeTerm.id) return;

    try {
      const { error } = await supabase.from('exams').insert({
        term_id: activeTerm.id,
        class_id: examClassId,
        subject_id: examSubjectId,
        title: examTitle,
        exam_type: examType,
        total_marks: 20,
        duration_minutes: Number(durationMinutes),
        is_cbt: isCbt,
        cbt_status: 'published'
      });

      if (error) throw error;
      showToast('Assessment created successfully');
      setIsModalOpen(false);
      fetchExamsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Open CBT question bank manager
  const handleManageCbt = async (exam) => {
    setSelectedExamForCbt(exam);
    try {
      const { data: qData } = await supabase
        .from('cbt_questions')
        .select(`
          *,
          cbt_options (*)
        `)
        .eq('exam_id', exam.id)
        .order('sort_order');

      setCbtQuestions(qData || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Question to CBT
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamForCbt || !newQuestionText) return;

    try {
      const { data: q, error: qErr } = await supabase
        .from('cbt_questions')
        .insert({
          exam_id: selectedExamForCbt.id,
          question_text: newQuestionText,
          marks: 2.0,
          sort_order: cbtQuestions.length + 1
        })
        .select()
        .single();

      if (qErr) throw qErr;

      // Insert options
      const options = [
        { question_id: q.id, option_key: 'A', option_text: optA || 'Option A', is_correct: correctKey === 'A' },
        { question_id: q.id, option_key: 'B', option_text: optB || 'Option B', is_correct: correctKey === 'B' },
        { question_id: q.id, option_key: 'C', option_text: optC || 'Option C', is_correct: correctKey === 'C' },
        { question_id: q.id, option_key: 'D', option_text: optD || 'Option D', is_correct: correctKey === 'D' },
      ];

      await supabase.from('cbt_options').insert(options);

      showToast('Question added to exam');
      setNewQuestionText('');
      setOptA(''); setOptB(''); setOptC(''); setOptD('');
      handleManageCbt(selectedExamForCbt);
      fetchExamsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Exams, CBT & Continuous Assessment</h1>
          <p className="text-xs text-slate-500">
            Computer-based test question banks, auto-grading, and term Continuous Assessment score sheets
          </p>
        </div>

        <button
          onClick={() => {
            setExamClassId(classes[0]?.id || '');
            setExamSubjectId(subjects[0]?.id || '');
            setExamTitle('');
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-blue/30 transition-all w-fit"
        >
          <Plus size={16} />
          <span>Create New Assessment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'exams' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Assessments & CBT Bank ({exams.length})
        </button>
        <button
          onClick={() => setActiveTab('scoresheet')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'scoresheet' ? 'border-brand-blue text-brand-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manual Score Sheet Entry (CA 40% + Exam 60%)
        </button>
      </div>

      {/* Tab 1: Assessments & CBT */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-blue/40 transition-all">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    exam.is_cbt ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-brand-blue'
                  }`}>
                    {exam.is_cbt ? 'CBT Online' : 'Written / Offline'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{exam.duration_minutes} mins</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{exam.title}</h3>
                <div className="text-xs text-slate-600 mt-1 font-semibold">
                  {exam.subjects?.name} ({exam.subjects?.code})
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Class: <strong>{exam.classes?.name} {exam.classes?.arm}</strong> • {exam.exam_type}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">CBT Questions:</span>
                  <span className="font-bold text-slate-900">{exam.cbt_questions?.length || 0} Questions</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                {exam.is_cbt ? (
                  <button
                    onClick={() => handleManageCbt(exam)}
                    className="flex items-center space-x-1 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
                  >
                    <HelpCircle size={14} />
                    <span>Manage Question Bank</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Score Entry in Score Sheet</span>
                )}
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Published
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Manual Scoresheet */}
      {activeTab === 'scoresheet' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class</label>
                <select
                  value={scoreClassId}
                  onChange={(e) => setScoreClassId(e.target.value)}
                  className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Subject</label>
                <select
                  value={scoreSubjectId}
                  onChange={(e) => setScoreSubjectId(e.target.value)}
                  className="py-1.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveScoreSheet}
              disabled={savingScores}
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Save size={15} />
              <span>{savingScores ? 'Saving...' : 'Save & Compute Grades'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-white uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Pupil</th>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">CA 1 (Max 20)</th>
                  <th className="py-3 px-3">CA 2 (Max 20)</th>
                  <th className="py-3 px-3">Exam (Max 60)</th>
                  <th className="py-3 px-3">Total (100)</th>
                  <th className="py-3 px-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentsScores.map((row, idx) => {
                  const currentTotal = Number(row.ca1_score || 0) + Number(row.ca2_score || 0) + Number(row.exam_score || 0);

                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-blue">{row.admission_number}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={row.ca1_score}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentsScores(prev => prev.map((item, i) => i === idx ? { ...item, ca1_score: val } : item));
                          }}
                          className="w-20 p-1.5 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={row.ca2_score}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentsScores(prev => prev.map((item, i) => i === idx ? { ...item, ca2_score: val } : item));
                          }}
                          className="w-20 p-1.5 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={row.exam_score}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentsScores(prev => prev.map((item, i) => i === idx ? { ...item, exam_score: val } : item));
                          }}
                          className="w-20 p-1.5 border border-slate-200 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="py-3 px-3 font-black text-brand-navy text-sm">
                        {currentTotal}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          currentTotal >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          currentTotal >= 65 ? 'bg-blue-100 text-blue-800' :
                          currentTotal >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {currentTotal >= 75 ? 'A' : currentTotal >= 65 ? 'B' : currentTotal >= 50 ? 'C' : currentTotal >= 40 ? 'P' : 'F'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CBT Question Builder Modal */}
      {selectedExamForCbt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">CBT Question Bank: {selectedExamForCbt.title}</h3>
                <p className="text-xs text-slate-300">Class: {selectedExamForCbt.classes?.name} • {selectedExamForCbt.subjects?.name}</p>
              </div>
              <button onClick={() => setSelectedExamForCbt(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Existing questions */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-3">
                  Current Questions ({cbtQuestions.length})
                </h4>
                <div className="space-y-3">
                  {cbtQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {q.question_text}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {q.cbt_options?.map(opt => (
                          <div key={opt.id} className={`p-2 rounded-lg border ${
                            opt.is_correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <strong>{opt.option_key}.</strong> {opt.option_text} {opt.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Question Form */}
              <form onSubmit={handleAddQuestion} className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                <h4 className="font-bold text-brand-navy uppercase text-[11px]">
                  Add Multiple Choice Question
                </h4>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Question Prompt *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="e.g. Which of the following is a primary color?"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Option A</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Option B</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Option C</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purple"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Option D</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pink"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Correct Answer Key</label>
                  <select
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value)}
                    className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-bold text-emerald-700"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold shadow-md hover:bg-brand-blue-hover"
                >
                  Save Question to CBT
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Create Assessment / Examination</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term Mathematics CBT Assessment"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class</label>
                  <select
                    value={examClassId}
                    onChange={(e) => setExamClassId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject</label>
                  <select
                    value={examSubjectId}
                    onChange={(e) => setExamSubjectId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Exam Category</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="CA1">CA 1</option>
                    <option value="CA2">CA 2</option>
                    <option value="MidTerm">Mid-Term CBT</option>
                    <option value="TerminalExam">End of Term Examination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_cbt"
                  checked={isCbt}
                  onChange={(e) => setIsCbt(e.target.checked)}
                  className="rounded text-brand-blue"
                />
                <label htmlFor="is_cbt" className="font-semibold text-slate-700">
                  Enable Online Computer-Based Testing (CBT)
                </label>
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
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsModule;
