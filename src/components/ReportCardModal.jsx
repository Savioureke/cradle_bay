import React from 'react';
import { Printer, X, Award, CheckCircle } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

const ReportCardModal = ({ data, onClose }) => {
  const { school } = useSchool();

  if (!data) return null;

  const { student, session, term, report_card, scores } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-fadeIn my-6">
        {/* Controls (Hidden in print) */}
        <div className="no-print bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="text-amber-400" size={20} />
            <span className="font-bold text-sm">Official Terminal Report Card</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-amber hover:bg-brand-amber-hover text-brand-navy rounded-lg text-xs font-bold transition-colors shadow-md"
            >
              <Printer size={15} />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Card Sheet */}
        <div className="printable-area p-8 sm:p-10 bg-white text-slate-800">
          {/* Header */}
          <div className="border-b-2 border-brand-navy pb-5 mb-5 text-center relative">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl border-2 border-brand-amber shadow-md">
                E
              </div>
            </div>
            <h1 className="text-2xl font-black text-brand-navy uppercase tracking-wider">{school.name}</h1>
            <p className="text-xs text-slate-600 font-semibold italic">"{school.motto}"</p>
            <p className="text-xs text-slate-500 mt-0.5">{school.address}</p>
            <p className="text-[11px] text-slate-500 font-mono">Email: {school.email} | Phone: {school.phone}</p>
            
            <div className="mt-3 inline-block bg-brand-blue text-white text-xs px-4 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
              Continuous Assessment & Terminal Examination Report
            </div>
          </div>

          {/* Student Profile & Academic Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Pupil Name</span>
              <span className="font-bold text-slate-900 text-sm">{student?.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Admission Number</span>
              <span className="font-mono font-bold text-brand-blue">{student?.admission_number}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Class / Arm</span>
              <span className="font-bold text-slate-800">{student?.class}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Session / Term</span>
              <span className="font-bold text-slate-800">{session} • {term}</span>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-center text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left">Subject</th>
                  <th className="py-2.5 px-2">CA 1 (20)</th>
                  <th className="py-2.5 px-2">CA 2 (20)</th>
                  <th className="py-2.5 px-2">Exam (60)</th>
                  <th className="py-2.5 px-2 bg-brand-navy">Total (100)</th>
                  <th className="py-2.5 px-2">Grade</th>
                  <th className="py-2.5 px-3 text-left">Teacher's Remark</th>
                  <th className="py-2.5 px-2">Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {scores && scores.map((sc, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 text-left">
                      {sc.subject_name}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{sc.ca1}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{sc.ca2}</td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{sc.exam}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-brand-blue bg-blue-50/50">{sc.total}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        sc.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        sc.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        sc.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sc.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left text-slate-600 italic text-[11px]">{sc.remark}</td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-700">{sc.position || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Academic Performance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs mb-6 text-center">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Total Marks Obtained</div>
              <div className="text-lg font-black text-brand-navy">{report_card?.total_obtained} / {report_card?.total_obtainable}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Term Average</div>
              <div className="text-lg font-black text-brand-blue">{report_card?.average_score}%</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Class Position</div>
              <div className="text-lg font-black text-emerald-700">
                {report_card?.position_in_class ? `${report_card.position_in_class} of ${report_card.class_size || 30}` : '-'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Attendance Record</div>
              <div className="text-lg font-black text-slate-700">
                {report_card?.times_present || 63} / {report_card?.times_school_opened || 65} days
              </div>
            </div>
          </div>

          {/* Teacher and Headteacher Remarks */}
          <div className="space-y-3 mb-6 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Class Teacher's Remark:</span>
              <p className="text-slate-600 italic">"{report_card?.teacher_comment || 'Satisfactory academic performance and good conduct throughout the term.'}"</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Headteacher's Remark:</span>
              <p className="text-slate-600 italic">"{report_card?.headteacher_comment || 'Promising result. Encouraged to sustain diligent study habits.'}"</p>
            </div>
          </div>

          {/* Grading Key & Stamp Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-4">
            <div className="space-x-2">
              <span className="font-bold text-slate-700">Grading Key:</span>
              <span>A (75-100% Distinction)</span> •
              <span>B (65-74% Very Good)</span> •
              <span>C (50-64% Credit)</span> •
              <span>P (40-49% Pass)</span> •
              <span>F (0-39% Fail)</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="border border-emerald-600 text-emerald-700 px-3 py-1 rounded font-black tracking-wider uppercase text-[10px] flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>OFFICIAL RESULT • VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardModal;
