import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sparkles, Database, FileCheck, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center z-10 animate-fade-in">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs text-indigo-400 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium tracking-wide">AI-Powered Job Scraper & Matching</span>
          </div>

          {/* Main Headings */}
          <h1 className="font-outfit text-4xl font-extrabold tracking-tight sm:text-6xl text-white mb-6">
            Scrape external listings.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">
              Match your resume.
            </span>
            <br />
            Track applications.
          </h1>

          <p className="mx-auto max-w-2xl text-gray-400 text-base sm:text-lg mb-10 leading-relaxed">
            TalentScrape connects students and hiring managers. Students can scrape and analyze active listings from external platforms in seconds, while hiring managers gain advanced applicant tracking pipelines.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            {user ? (
              <Link
                to={user.role === 'student' ? '/dashboard/student' : '/dashboard/manager'}
                className="glow-btn flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="glow-btn flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-gray-200 font-semibold px-8 py-3.5 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 w-full sm:w-auto"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats Section with Glassmorphic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-16 animate-slide-up">
            {[
              { label: 'External Jobs Scraped', value: '15,000+', icon: Database, color: 'text-indigo-400' },
              { label: 'Resume Match Accuracy', value: '98.4%', icon: TrendingUp, color: 'text-violet-400' },
              { label: 'Active Candidates', value: '3,200+', icon: FileCheck, color: 'text-pink-400' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="glass-card p-6 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <h3 className="font-outfit text-2xl font-bold text-white leading-none mb-1">{stat.value}</h3>
                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dual Flow Preview (Manager vs. Student) */}
          <div className="border-t border-gray-900 pt-16 max-w-4xl mx-auto">
            <h2 className="font-outfit text-2xl font-bold text-white mb-10">Tailored Dashboards for Every Need</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Role */}
              <div className="glass-card p-8 rounded-2xl border-l-4 border-l-indigo-500 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">For Students</span>
                <h3 className="font-outfit text-xl font-bold text-white mt-2 mb-4">Launch Your Career</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Scrape external jobs in real time using query keywords.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Run AI resume matching for compatibility checks.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>Manage profile skills and track job application statuses.</span>
                  </li>
                </ul>
              </div>

              {/* Manager Role */}
              <div className="glass-card p-8 rounded-2xl border-l-4 border-l-violet-500 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">For Hiring Managers</span>
                <h3 className="font-outfit text-xl font-bold text-white mt-2 mb-4">Optimize Hiring Workflows</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Post, edit, and close job openings dynamically.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Track student applicants with interactive status popups.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span>Automatic simulation logs for email applicant notifications.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-6 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Kalpana Software Solution Pvt. Ltd. Take-home Assessment.</p>
      </footer>
    </div>
  );
};
