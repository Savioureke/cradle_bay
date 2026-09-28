import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  admin: {
    id: 'demo-admin-001',
    email: 'admin@edenacademyfwangnin.sch.ng',
    role: 'admin',
    full_name: 'Saviour Admin (Lead)',
    phone: '+234 803 456 7890',
  },
  teacher: {
    id: 'demo-teacher-001',
    teacher_id: 'eaf-teacher-001',
    email: 'pam.gyang@edenacademyfwangnin.sch.ng',
    role: 'teacher',
    full_name: 'Mr. Dung Pam Gyang',
    phone: '+234 803 111 2233',
    qualification: 'B.Sc. Ed (Mathematics)',
    specialization: 'Mathematics & Quantitative Reasoning',
  },
  parent: {
    id: 'demo-parent-001',
    email: 'mahanan.gofwen@gmail.com',
    role: 'parent',
    full_name: 'Dr. Mahanan Gofwen',
    phone: '+234 803 700 8899',
    wards: [
      { id: '304bf2eb-d0be-4153-80c8-84c179ee06fb', admission_number: 'EAF/2025/001', name: 'David Mahanan Gofwen', class_name: 'Primary 1 Gold' }
    ]
  },
  student: {
    id: 'demo-student-001',
    student_id: '304bf2eb-d0be-4153-80c8-84c179ee06fb',
    admission_number: 'EAF/2025/001',
    email: 'david.gofwen@student.edenacademy.ng',
    role: 'student',
    full_name: 'David Mahanan Gofwen',
    class_name: 'Primary 1 Gold',
    gender: 'Male',
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eaf_current_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.admin; // Default to admin for seamless setup
  });

  const [activeWard, setActiveWard] = useState(() => {
    const saved = localStorage.getItem('eaf_active_ward');
    return saved ? JSON.parse(saved) : DEMO_USERS.parent.wards[0];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('eaf_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eaf_current_user');
    }
  }, [user]);

  useEffect(() => {
    if (activeWard) {
      localStorage.setItem('eaf_active_ward', JSON.stringify(activeWard));
    }
  }, [activeWard]);

  const loginAsDemo = (roleKey) => {
    const target = DEMO_USERS[roleKey];
    if (target) {
      setUser(target);
      if (target.role === 'parent' && target.wards?.length > 0) {
        setActiveWard(target.wards[0]);
      }
      return true;
    }
    return false;
  };

  const loginWithCredentials = async (email, password, roleHint = 'admin') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const userObj = {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || roleHint,
        full_name: profile?.full_name || email.split('@')[0],
      };
      setUser(userObj);
      return { success: true, role: userObj.role };
    } catch (err) {
      // Fallback: if offline or using demo test account
      const matched = Object.values(DEMO_USERS).find(u => 
        u.email.toLowerCase() === email.toLowerCase() || 
        (email.toLowerCase().includes('admin') && u.role === 'admin')
      );
      if (matched) {
        setUser(matched);
        return { success: true, role: matched.role };
      }
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eaf_current_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      activeWard,
      setActiveWard,
      loginAsDemo,
      loginWithCredentials,
      logout,
      isAdmin: user?.role === 'admin',
      isTeacher: user?.role === 'teacher',
      isStudent: user?.role === 'student',
      isParent: user?.role === 'parent',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
