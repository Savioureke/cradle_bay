import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { 
  BookMarked, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, Send, Sparkles, RefreshCw 
} from 'lucide-react';

const StudentCBT = () => {
  const { user } = useAuth();
  const { showToast } = useSchool();
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [resultScore, setResultScore] = useState(null);

  useEffect(() => {
    const fetchCbtExams = async () => {
      const { data } = await supabase
        .from('exams')
        .select('*, subjects (name, code), classes (name, arm)')
        .eq('is_cbt', true)
        .eq('cbt_status', 'published');

      setExams(data || []);
    };
    fetchCbtExams();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!activeExam || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, submitted, timeLeft]);

  const handleStartExam = async (exam) => {
    setActiveExam(exam);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setResultScore(null);
    setTimeLeft((exam.duration_minutes || 20) * 60);

    // Fetch questions and options
    const { data: qList } = await supabase
      .from('cbt_questions')
      .select('*, cbt_options (*)')
      .eq('exam_id', exam.id)
      .order('sort_order');

    setQuestions(qList || []);
  };

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitTest = () => {
    let score = 0;
    let correctCount = 0;

    questions.forEach(q => {
      const chosenOptId = selectedAnswers[q.id];
      const correctOpt = q.cbt_options?.find(o => o.is_correct);
      if (chosenOptId && correctOpt && chosenOptId === correctOpt.id) {
        score += Number(q.marks || 2.0);
        correctCount++;
      }
    });

    setResultScore({
      score,
      totalPossible: questions.reduce((acc, q) => acc + Number(q.marks || 2.0), 0),
      correctCount,
      totalQuestions: questions.length,
    });
    setSubmitted(true);
    showToast('CBT Exam submitted successfully!');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // If in active exam mode
  if (activeExam) {
    if (submitted && resultScore) {
      return (
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-card border border-slate-200 p-8 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Exam Completed!</h2>
          <p className="text-xs text-slate-500">
            Great job! Your answers have been recorded and graded automatically.
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 my-4">
            <span className="text-xs text-slate-400 font-bold uppercase block">Your Score</span>
            <div className="text-4xl font-black text-brand-blue my-2">
              {resultScore.score} / {resultScore.totalPossible}
            </div>
            <div className="text-xs text-emerald-700 font-bold">
              {resultScore.correctCount} of {resultScore.totalQuestions} Questions Correct
            </div>
          </div>

          <button
            onClick={() => setActiveExam(null)}
            className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-xs"
          >
            Back to Assessment List
          </button>
        </div>
      );
    }

    const currentQ = questions[currentQIndex];

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Test Header with countdown timer */}
        <div className="bg-brand-navy p-5 text-white rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Computer Based Test</span>
            <h2 className="font-bold text-base">{activeExam.title}</h2>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <Clock size={16} className={timeLeft < 180 ? 'text-red-400 animate-pulse' : 'text-amber-400'} />
            <span className="font-mono text-base font-black tracking-wider">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        {currentQ ? (
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full">
                {currentQ.marks || 2} Marks
              </span>
            </div>

            <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question_text}
            </div>

            {/* Big touch target options for primary pupils */}
            <div className="space-y-3">
              {currentQ.cbt_options?.map(opt => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left flex items-center space-x-4 transition-all ${
                      isSelected
                        ? 'border-brand-blue bg-blue-50/80 text-brand-blue font-bold shadow-md'
                        : 'border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opt.option_key}
                    </div>
                    <span className="text-sm font-semibold">{opt.option_text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
                className="flex items-center space-x-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 disabled:opacity-30"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold shadow-md"
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitTest}
                  className="flex items-center space-x-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  <Send size={14} />
                  <span>Submit Exam</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl">
            No questions found in this assessment bank.
          </div>
        )}
      </div>
    );
  }

  // Exam Selection Screen
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-brand-navy">Computer-Based Testing (CBT)</h1>
        <p className="text-xs text-slate-500">
          Take scheduled online objective continuous assessments and practice tests
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:border-brand-blue transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Online CBT Test
                </span>
                <span className="text-xs text-slate-400 font-mono">{exam.duration_minutes} mins</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{exam.title}</h3>
              <p className="text-xs text-brand-blue font-semibold mt-1">
                {exam.subjects?.name} ({exam.subjects?.code})
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Class: {exam.classes?.name} {exam.classes?.arm}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t">
              <button
                onClick={() => handleStartExam(exam)}
                className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <BookMarked size={15} />
                <span>Start Test Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentCBT;
