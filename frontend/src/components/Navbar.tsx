import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              TalentScrape
            </span>
          </Link>

          {/* Navigation Tabs (Only when on Dashboard page and handler is provided) */}
          {user && isDashboard && setActiveTab && (
            <div className="hidden md:flex space-x-1">
              {user.role === 'student' ? (
                <>
                  {['search', 'applications', 'profile', 'ai'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1) === 'Ai' ? 'AI Recommendations' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {['jobs', 'applicants'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                      }`}
                    >
                      {tab === 'jobs' ? 'Manage Jobs' : 'Applicant Tracking'}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Profile indicator */}
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-200">{user.full_name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                  </div>
                </div>

                {/* Dashboard Shortcut link */}
                {!isDashboard && (
                  <Link
                    to={user.role === 'student' ? '/dashboard/student' : '/dashboard/manager'}
                    className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-all duration-300"
                  >
                    Go to Dashboard
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center p-2 rounded-lg border border-gray-800 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="glow-btn inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white px-4 py-1.5 rounded-lg shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
