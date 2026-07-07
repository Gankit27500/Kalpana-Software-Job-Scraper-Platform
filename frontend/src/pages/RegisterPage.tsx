import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User as UserIcon, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'manager'>('student');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // 1. Hit registration endpoint
      const registerRes = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          skills: '',
          resume_text: ''
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.detail || 'Registration failed. Email might already be taken.');
      }

      setSuccess(true);

      // 2. Auto-login on success
      const loginRes = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }

      // Log user in and navigate
      setTimeout(() => {
        login(loginData.access_token, loginData.user);
        if (loginData.user.role === 'student') {
          navigate('/dashboard/student');
        } else {
          navigate('/dashboard/manager');
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-950 relative">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10 animate-fade-in">
        {/* Header Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="font-outfit text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              TalentScrape
            </span>
          </Link>
          <h2 className="font-outfit text-3xl font-extrabold text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Log in instead
            </Link>
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-gray-800/80 shadow-2xl bg-gray-900/40">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-scale-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="font-outfit text-xl font-bold text-white">Registration Successful!</h3>
              <p className="text-sm text-gray-400">Preparing your personalized dashboard...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start space-x-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Toggle Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-950 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      role === 'student'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      role === 'manager'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Hiring Manager
                  </button>
                </div>
              </div>

              {/* Full Name Field */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-800 bg-gray-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="glow-btn w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 cursor-pointer mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                {!loading && <ArrowRight className="h-4.5 w-4.5" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
