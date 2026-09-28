import React from 'react';
import ExamsModule from '../admin/ExamsModule';

// Teacher exams interface utilizes the Exams and CBT module with teacher role context
const TeacherExams = () => {
  return (
    <div className="space-y-4">
      <ExamsModule />
    </div>
  );
};

export default TeacherExams;
