import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, School, 
  AlertCircle, RefreshCw 
} from 'lucide-react';

const LoginPage = () => {
  const { loginWithCredentials } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginWithCredentials(email.trim(), password);
    setLoading(false);

    if (result.success && result.role) {
      // Automatic role-based routing
      if (result.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (result.role === 'teacher') {
        navigate('/teachers', { replace: true });
      } else {
        // 'student' or 'parent'
        navigate('/students', { replace: true });
      }
    } else {
      setError(result.error || 'Invalid email or password. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-navy text-brand-amber flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-navy/20 border-2 border-brand-amber">
            E
          </div>
        </Link>
        <h2 className="text-2xl font-black text-brand-navy uppercase tracking-tight">
          {school.name}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Bokkos, Plateau State • Unified School Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Account Sign In</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered school email address and password to access your designated portal.
            </p>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px]">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@edenacademyfwangnin.sch.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px]">
                Password *
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-navy hover:bg-slate-800 text-white rounded-xl font-bold shadow-md shadow-brand-navy/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-xs tracking-wider uppercase mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Secure 256-Bit SSL Auth</span>
            <Link to="/" className="text-brand-blue font-semibold hover:underline">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
