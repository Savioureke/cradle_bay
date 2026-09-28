import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './components/AdminLayout';
import TeacherLayout from './components/TeacherLayout';
import StudentLayout from './components/StudentLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import ResultCheckerPublic from './pages/ResultCheckerPublic';
import LoginPage from './pages/LoginPage';

// Admin modules
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsModule from './pages/admin/StudentsModule';
import TeachersModule from './pages/admin/TeachersModule';
import SubjectsModule from './pages/admin/SubjectsModule';
import ClassesModule from './pages/admin/ClassesModule';
import FeesModule from './pages/admin/FeesModule';
import TimetableModule from './pages/admin/TimetableModule';
import AttendanceModule from './pages/admin/AttendanceModule';
import ExamsModule from './pages/admin/ExamsModule';
import ResultsModule from './pages/admin/ResultsModule';
import ELearningAdmin from './pages/admin/ELearningAdmin';
import CommunicationsAdmin from './pages/admin/CommunicationsAdmin';
import SettingsModule from './pages/admin/SettingsModule';

// Teacher pages
import TeacherDashboard from './pages/teachers/TeacherDashboard';
import TeacherAttendance from './pages/teachers/TeacherAttendance';
import TeacherExams from './pages/teachers/TeacherExams';
import TeacherELearning from './pages/teachers/TeacherELearning';
import TeacherTimetable from './pages/teachers/TeacherTimetable';
import TeacherCommunications from './pages/teachers/TeacherCommunications';
import TeacherLeave from './pages/teachers/TeacherLeave';

// Student pages
import StudentDashboard from './pages/students/StudentDashboard';
import StudentFees from './pages/students/StudentFees';
import StudentResults from './pages/students/StudentResults';
import StudentCBT from './pages/students/StudentCBT';
import StudentTimetable from './pages/students/StudentTimetable';
import StudentELearning from './pages/students/StudentELearning';
import StudentCommunications from './pages/students/StudentCommunications';

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/results" element={<Navigate to="/login" replace />} />
      <Route path="/results/check" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Portal Namespace */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsModule />} />
        <Route path="teachers" element={<TeachersModule />} />
        <Route path="subjects" element={<SubjectsModule />} />
        <Route path="classes" element={<ClassesModule />} />
        <Route path="fees" element={<FeesModule />} />
        <Route path="timetable" element={<TimetableModule />} />
        <Route path="attendance" element={<AttendanceModule />} />
        <Route path="exams" element={<ExamsModule />} />
        <Route path="results" element={<ResultsModule />} />
        <Route path="elearning" element={<ELearningAdmin />} />
        <Route path="communications" element={<CommunicationsAdmin />} />
        <Route path="settings" element={<SettingsModule />} />
      </Route>

      {/* Teacher Portal Namespace */}
      <Route path="/teachers" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="exams" element={<TeacherExams />} />
        <Route path="elearning" element={<TeacherELearning />} />
        <Route path="timetable" element={<TeacherTimetable />} />
        <Route path="communications" element={<TeacherCommunications />} />
        <Route path="leave" element={<TeacherLeave />} />
      </Route>

      {/* Student / Parent Portal Namespace */}
      <Route path="/students" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="exams" element={<StudentCBT />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="elearning" element={<StudentELearning />} />
        <Route path="communications" element={<StudentCommunications />} />
      </Route>

      {/* Catch-all redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
