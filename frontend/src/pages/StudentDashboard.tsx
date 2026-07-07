import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { 
  Search, Database, FileText, Sparkles, Filter, 
  ArrowRight, CheckCircle, Brain, RefreshCw,
  MapPin, DollarSign, Calendar, AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  job_type: string;
  source: string;
  created_at: string;
}

interface Application {
  id: number;
  job_id: number;
  status: string;
  applied_at: string;
  cover_letter: string;
  resume_text: string;
  job: Job;
}

interface MatchResponse {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
}

export const StudentDashboard: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('search');

  // --- Search & Scrape State ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Scraper controls
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapeLoc, setScrapeLoc] = useState('Remote');
  const [scrapePlatform, setScrapePlatform] = useState('All');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState(0); // 0: idle, 1: connecting, 2: scraping, 3: parsing, 4: done
  const [scrapedResultMsg, setScrapedResultMsg] = useState('');
  const [showScrapeModal, setShowScrapeModal] = useState(false);

  // --- Modals State ---
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobMatch, setJobMatch] = useState<MatchResponse | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Apply form state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [appResume, setAppResume] = useState(user?.resume_text || '');
  const [applying, setApplying] = useState(false);

  // --- Application History State ---
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // --- Profile state ---
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profileSkills, setProfileSkills] = useState(user?.skills || '');
  const [profileResume, setProfileResume] = useState(user?.resume_text || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // --- AI Recommendations state ---
  const [recs, setRecs] = useState<{ job: Job; match_score: number }[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Fetch Jobs list
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const skip = (page - 1) * 8;
      const url = `${API_BASE}/api/jobs?skip=${skip}&limit=8` +
        `&search=${encodeURIComponent(searchQuery)}` +
        `&location=${encodeURIComponent(locationQuery)}` +
        `&source=${sourceFilter}` +
        `&job_type=${jobTypeFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs);
        setTotalJobs(data.total);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch Application History
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await fetch(`${API_BASE}/api/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setApplications(data);
      }
    } catch (e) {
      console.error('Error fetching applications:', e);
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch AI Recommendations
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setRecs(data);
      }
    } catch (e) {
      console.error('Error fetching recommendations:', e);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Trigger search on filter changes or page changes
  useEffect(() => {
    if (activeTab === 'search') {
      fetchJobs();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'ai') {
      fetchRecommendations();
    }
  }, [activeTab, page, sourceFilter, jobTypeFilter]);

  // Load initial search on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  // Handle Mock Scrape Submission
  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeQuery.trim()) return;

    setIsScraping(true);
    setScrapedResultMsg('');
    setScrapeStep(1);

    // Visual animation steps
    const timer1 = setTimeout(() => setScrapeStep(2), 1000); // Scraping
    const timer2 = setTimeout(() => setScrapeStep(3), 2200); // Parsing

    try {
      // Trigger API Scraper
      const response = await fetch(`${API_BASE}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: scrapeQuery,
          location: scrapeLoc,
          platform: scrapePlatform
        })
      });

      const data = await response.json();
      
      // Delay response slightly to finish animations naturally
      await new Promise(resolve => setTimeout(resolve, 3200));

      if (response.ok) {
        setScrapedResultMsg(data.message);
        setScrapeStep(4);
        setPage(1);
        fetchJobs(); // refresh the listings
      } else {
        throw new Error(data.detail || 'Failed to trigger scraper.');
      }
    } catch (err: any) {
      setScrapedResultMsg(`Error: ${err.message || 'Scraper connection failed'}`);
      setScrapeStep(4);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsScraping(false);
    }
  };

  // View Job details and request match score
  const handleViewJobDetails = async (job: Job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
    setJobMatch(null);
    setLoadingMatch(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/match/${job.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setJobMatch(data);
      }
    } catch (e) {
      console.error('Error fetching job match details:', e);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Apply Form Submission
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplying(true);

    try {
      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: selectedJob.id,
          cover_letter: coverLetter,
          resume_text: appResume
        })
      });

      const data = await response.json();
      if (response.ok) {
        setShowApplyModal(false);
        setCoverLetter('');
        // Show success alert/message
        alert('Application submitted successfully! Checked simulated logs.');
      } else {
        alert(data.detail || 'Application failed to submit.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting application');
    } finally {
      setApplying(false);
    }
  };

  // Update Profile Details
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg(false);

    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'HTTP_PUT' in window ? 'PUT' : 'PUT', // standard PUT method
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profileName,
          skills: profileSkills,
          resume_text: profileResume
        })
      });

      const data = await response.json();
      if (response.ok) {
        updateUser(data);
        setProfileSuccessMsg(true);
        // Sync cover letter resume template
        setAppResume(profileResume);
        setTimeout(() => setProfileSuccessMsg(false), 3000);
      } else {
        alert(data.detail || 'Profile update failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- TAB 1: SEARCH & SCRAPE --- */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search and Scrape Banner Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-outfit text-3xl font-bold text-white">Job Search Hub</h1>
                <p className="text-gray-400 text-sm mt-1">Search through internal postings or scrape external jobs instantly.</p>
              </div>

              {/* Scraper Launch Button */}
              <button
                onClick={() => {
                  setScrapeQuery(searchQuery || 'React Developer');
                  setShowScrapeModal(true);
                }}
                className="glow-btn inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                <Database className="h-4.5 w-4.5" />
                <span>Scrape External Platforms</span>
              </button>
            </div>

            {/* Query Filters Form */}
            <div className="glass-panel p-5 rounded-2xl bg-gray-900/30">
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search keywords, company, titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Location (e.g. Remote, Seattle)..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Search Postings</span>
                </button>
              </form>

              {/* Sub-Filters Row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Smart Filters:</span>
                </div>

                {/* Source Filter */}
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-950 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="internal">Internal Jobs Only</option>
                  <option value="indeed">Indeed Listings</option>
                  <option value="linkedin">LinkedIn Listings</option>
                  <option value="github jobs">GitHub Jobs Listings</option>
                </select>

                {/* Job Type Filter */}
                <select
                  value={jobTypeFilter}
                  onChange={(e) => {
                    setJobTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-950 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Jobs Results Display */}
            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-400">Loading active job board...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-base">No Job Openings Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Try broadening your search query filters, or trigger a live external scrape search above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => handleViewJobDetails(job)}
                      className="glass-card p-5 rounded-2xl border border-gray-800/60 flex flex-col justify-between hover:cursor-pointer transition-all duration-300"
                    >
                      <div>
                        {/* Source Tag & Title */}
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            job.source === 'internal'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : job.source === 'indeed'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {job.source}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">{job.job_type || 'Full-time'}</span>
                        </div>

                        <h3 className="font-outfit text-lg font-bold text-white mt-2.5 leading-snug">{job.title}</h3>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">{job.company}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-4">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{job.location}</span>
                          </span>
                          {job.salary && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>{job.salary}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Button Footer */}
                      <div className="mt-5 pt-4 border-t border-gray-800/40 flex items-center justify-between text-xs text-gray-400">
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        <span className="text-indigo-400 font-semibold group flex items-center space-x-1 hover:text-indigo-300 transition-colors">
                          <span>View Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalJobs > 8 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-900 text-sm">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-4 py-2 border border-gray-800 rounded-lg hover:border-gray-700 text-gray-400 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {page} of {Math.ceil(totalJobs / 8)}
                    </span>
                    <button
                      disabled={page >= Math.ceil(totalJobs / 8)}
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 border border-gray-800 rounded-lg hover:border-gray-700 text-gray-400 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: APPLICATION HISTORY --- */}
        {activeTab === 'applications' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-outfit text-3xl font-bold text-white">Application History</h1>
              <p className="text-gray-400 text-sm mt-1">Track the live progress of your job applications.</p>
            </div>

            {loadingApps ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-400">Loading history logs...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                <FileText className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-base">No Applications Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">You haven't applied to any job listings yet. Find job opportunities in the Search Hub and apply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const statusSteps = ['applied', 'reviewing', 'interviewing', 'offered', 'rejected'];
                  const statusColors: any = {
                    applied: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    reviewing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    interviewing: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    offered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
                  };
                  
                  const isRejected = app.status === 'rejected';
                  const currentIdx = statusSteps.indexOf(app.status);
                  
                  return (
                    <div key={app.id} className="glass-panel p-6 rounded-2xl border border-gray-800/80">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-800/40">
                        <div>
                          <h3 className="font-outfit text-lg font-bold text-white leading-tight">{app.job.title}</h3>
                          <p className="text-sm text-gray-400 font-medium">{app.job.company} &bull; <span className="text-xs text-gray-500">{app.job.location}</span></p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${statusColors[app.status]}`}>
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Tracker Timeline progress bar */}
                      <div className="mt-6">
                        <div className="relative flex justify-between">
                          {/* Background tracker line */}
                          <div className="absolute top-2 left-4 right-4 h-0.5 bg-gray-800 -z-10" />
                          
                          {/* Color progress fill */}
                          {!isRejected && (
                            <div 
                              className="absolute top-2 left-4 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 -z-10 transition-all duration-500" 
                              style={{ width: `${(currentIdx / 3) * 100}%` }}
                            />
                          )}

                          {/* Steps circles */}
                          {['Applied', 'Reviewing', 'Interviewing', 'Offered'].map((step) => {
                            const stepLower = step.toLowerCase();
                            const stepIdx = statusSteps.indexOf(stepLower);
                            const isActive = currentIdx >= stepIdx && !isRejected;
                            const isCurrent = currentIdx === stepIdx && !isRejected;

                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? 'bg-indigo-500 border-indigo-400 shadow-md shadow-indigo-500/20'
                                    : isActive
                                    ? 'bg-gray-900 border-emerald-500'
                                    : 'bg-gray-950 border-gray-800'
                                }`}>
                                  {isActive && !isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                </div>
                                <span className={`text-[10px] font-semibold mt-2 ${
                                  isCurrent
                                    ? 'text-indigo-400'
                                    : isActive
                                    ? 'text-gray-300'
                                    : 'text-gray-500'
                                }`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}

                          {/* Show Rejected separately if applicable */}
                          {isRejected && (
                            <div className="flex flex-col items-center">
                              <div className="h-4 w-4 rounded-full bg-red-600 border-2 border-red-500 flex items-center justify-center" />
                              <span className="text-[10px] font-semibold mt-2 text-red-400">Rejected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: RESUME & PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h1 className="font-outfit text-3xl font-bold text-white">Profile & Resume</h1>
              <p className="text-gray-400 text-sm mt-1">Configure your personal details to enhance AI recommendations.</p>
            </div>

            {/* Profile Update Panel */}
            <div className="glass-panel p-8 rounded-2xl border border-gray-800/80">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {profileSuccessMsg && (
                  <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span>Your profile updates have been successfully saved. Match scores recalculated!</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Skills CSV */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Skills Checklist</label>
                    <span className="text-[10px] text-gray-500">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    placeholder="React, TypeScript, CSS, Node.js, Python..."
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Resume Text */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Resume Content Summary</label>
                    <span className="text-[10px] text-gray-500">AI extracts matching skills here</span>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="Enter your educational summary, experience details, projects, or copy/paste your resume plain text here..."
                    value={profileResume}
                    onChange={(e) => setProfileResume(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="glow-btn w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  {savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 4: AI MATCH RECOMMENDATIONS --- */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-indigo-400" />
              <div>
                <h1 className="font-outfit text-3xl font-bold text-white">AI Recommendations</h1>
                <p className="text-gray-400 text-sm mt-1">Recommended job postings based on skills in your profile resume.</p>
              </div>
            </div>

            {loadingRecs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-400">Running compatibility matrices...</p>
              </div>
            ) : recs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                <Sparkles className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-base">No Suggestions Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Please ensure you have filled out your profile skills or resume summary text first so we can rank compatibility!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recs.map(({ job, match_score }) => (
                  <div
                    key={job.id}
                    onClick={() => handleViewJobDetails(job)}
                    className="glass-card p-5 rounded-2xl border border-gray-800/60 flex flex-col justify-between hover:cursor-pointer transition-all duration-300"
                  >
                    <div>
                      {/* Top compatibility badge */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                          <span className={`text-xs font-bold ${
                            match_score >= 70 ? 'text-emerald-400' : match_score >= 40 ? 'text-amber-400' : 'text-gray-400'
                          }`}>
                            {match_score}% Compatibility Match
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 capitalize">{job.source}</span>
                      </div>

                      <h3 className="font-outfit text-lg font-bold text-white leading-snug">{job.title}</h3>
                      <p className="text-sm text-gray-400 font-medium">{job.company}</p>

                      {/* ProgressBar compatibility indicator */}
                      <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mt-3">
                        <div 
                          className={`h-full rounded-full ${
                            match_score >= 70 ? 'bg-emerald-500' : match_score >= 40 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${match_score}%` }}
                        />
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-4">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location}</span>
                        </span>
                        {job.salary && (
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{job.salary}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-800/40 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      <span>Review Score details &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- POP-UP MODAL: SCRAPE EXTERNAL JOBS --- */}
      <Modal
        isOpen={showScrapeModal}
        onClose={() => { if (!isScraping) setShowScrapeModal(false); }}
        title="Scrape External Job Platforms"
      >
        <form onSubmit={handleScrapeSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Job Query Keywords</label>
            <input
              type="text"
              required
              disabled={isScraping}
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              placeholder="e.g. React Developer, Data Scientist..."
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Location Filter</label>
              <input
                type="text"
                disabled={isScraping}
                value={scrapeLoc}
                onChange={(e) => setScrapeLoc(e.target.value)}
                placeholder="e.g. Remote, San Francisco"
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Platform</label>
              <select
                disabled={isScraping}
                value={scrapePlatform}
                onChange={(e) => setScrapePlatform(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
              >
                <option value="All">All Platforms</option>
                <option value="Indeed">Indeed</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="GitHub Jobs">GitHub Jobs</option>
              </select>
            </div>
          </div>

          {/* Scrape Animations steps logs */}
          {isScraping && (
            <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 space-y-2.5 animate-pulse-subtle">
              <div className="flex items-center space-x-2.5 text-xs">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                <span className={scrapeStep >= 1 ? "text-indigo-400 font-semibold" : "text-gray-600"}>
                  1. Launching scraper connection protocols...
                </span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs">
                {scrapeStep >= 2 ? (
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-gray-800" />
                )}
                <span className={scrapeStep >= 2 ? "text-indigo-400 font-semibold" : "text-gray-600"}>
                  2. Extracting metadata payloads from external HTML feeds...
                </span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs">
                {scrapeStep >= 3 ? (
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-gray-800" />
                )}
                <span className={scrapeStep >= 3 ? "text-indigo-400 font-semibold" : "text-gray-600"}>
                  3. Cleaning DOM records and syncing relational databases...
                </span>
              </div>
            </div>
          )}

          {/* Scraped Result summary */}
          {!isScraping && scrapedResultMsg && (
            <div className="flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{scrapedResultMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isScraping}
            className="glow-btn w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg cursor-pointer"
          >
            {isScraping ? 'Scraping live tables...' : 'Start Scraping Search'}
          </button>
        </form>
      </Modal>

      {/* --- POP-UP MODAL: JOB DETAILS & MATCHING ANALYSIS --- */}
      {selectedJob && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Job Specifications"
          maxWidth="xl"
        >
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                Source: {selectedJob.source}
              </span>
              <h2 className="font-outfit text-2xl font-bold text-white mt-3">{selectedJob.title}</h2>
              <p className="text-gray-400 text-sm font-semibold">{selectedJob.company}</p>
            </div>

            {/* Icons Grid details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 font-medium">Location</p>
                  <p className="text-gray-300 font-semibold">{selectedJob.location}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 font-medium">Salary Est.</p>
                  <p className="text-gray-300 font-semibold">{selectedJob.salary || 'Unspecified'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 font-medium">Job Type</p>
                  <p className="text-gray-300 font-semibold">{selectedJob.job_type || 'Full-time'}</p>
                </div>
              </div>
            </div>

            {/* AI Resume Match Meter */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/15">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <span className="font-outfit text-sm font-bold text-white">AI Compatibility Score</span>
                </div>
                {loadingMatch ? (
                  <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                ) : (
                  <span className={`text-base font-extrabold ${
                    jobMatch && jobMatch.match_score >= 70 ? 'text-emerald-400' : jobMatch && jobMatch.match_score >= 40 ? 'text-amber-400' : 'text-gray-400'
                  }`}>
                    {jobMatch ? `${jobMatch.match_score}%` : '0%'}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    jobMatch && jobMatch.match_score >= 70 ? 'bg-emerald-500' : jobMatch && jobMatch.match_score >= 40 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${jobMatch ? jobMatch.match_score : 0}%` }}
                />
              </div>

              {/* Matching / Missing skill tags */}
              {jobMatch && (
                <div className="space-y-3.5 text-xs">
                  {jobMatch.matching_skills.length > 0 && (
                    <div>
                      <p className="text-emerald-400 font-bold mb-1.5">Matching Skills ({jobMatch.matching_skills.length}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.matching_skills.map((skill) => (
                          <span key={skill} className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobMatch.missing_skills.length > 0 && (
                    <div>
                      <p className="text-red-400 font-bold mb-1.5">Missing Skills ({jobMatch.missing_skills.length}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.missing_skills.map((skill) => (
                          <span key={skill} className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobMatch.matching_skills.length === 0 && jobMatch.missing_skills.length === 0 && (
                    <p className="text-gray-500 italic">No keyword requirements specified for this opening.</p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-outfit text-sm font-bold text-white">Role Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Requirements list */}
            {selectedJob.requirements && (
              <div className="space-y-2">
                <h3 className="font-outfit text-sm font-bold text-white">Skill Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requirements.split(',').map((req) => (
                    <span key={req} className="bg-gray-950 text-gray-300 px-3 py-1 rounded-lg border border-gray-800 text-xs font-semibold">
                      {req.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button Footer */}
            <div className="pt-6 border-t border-gray-800/80 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowApplyModal(true);
                }}
                className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
              >
                <span>Apply to Role</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* --- POP-UP MODAL: APPLY TO JOB FORM --- */}
      {selectedJob && (
        <Modal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          title={`Apply for ${selectedJob.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Company</p>
              <p className="text-sm text-gray-200 font-bold">{selectedJob.company}</p>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Cover Letter</label>
              <textarea
                rows={4}
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief cover letter explaining why you are a good match for this role..."
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Application Resume text field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Resume Summary Details</label>
              <textarea
                rows={5}
                required
                value={appResume}
                onChange={(e) => setAppResume(e.target.value)}
                placeholder="Enter details of your projects, skills, and background..."
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-800/80 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowApplyModal(false);
                  setShowDetailsModal(true);
                }}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={applying}
                className="glow-btn bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
              >
                <span>{applying ? 'Submitting Application...' : 'Submit Application'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
