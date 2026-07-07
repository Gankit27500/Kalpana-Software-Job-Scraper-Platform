import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { 
  Plus, Edit, Trash2, Users, FileText, 
  MapPin, DollarSign, Eye, RefreshCw, 
  Briefcase, Mail, Award, UserCheck
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
  created_by_id: number;
  created_at: string;
}

interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  skills?: string;
  resume_text?: string;
}

interface Application {
  id: number;
  job_id: number;
  student_id: number;
  status: string;
  applied_at: string;
  cover_letter: string;
  resume_text: string;
  job: Job;
  student: UserResponse;
}

export const ManagerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  // --- Manage Jobs State ---
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Job Form Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  
  // Job Form Fields
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [jobLoc, setJobLoc] = useState('');
  const [jobSal, setJobSal] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [savingJob, setSavingJob] = useState(false);

  // --- Applicant Tracking State ---
  const [selectedJobId, setSelectedJobId] = useState<number | 'all'>('all');
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Applicant Details Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showAppDetailsModal, setShowAppDetailsModal] = useState(false);
  const [updatingAppStatus, setUpdatingAppStatus] = useState<number | null>(null);

  // Fetch Jobs created by this manager
  const fetchMyJobs = async () => {
    setLoadingJobs(true);
    try {
      // Fetch internal jobs
      const response = await fetch(`${API_BASE}/api/jobs?source=internal&limit=100`);
      const data = await response.json();
      if (response.ok) {
        // Filter jobs created by this manager
        const filtered = data.jobs.filter((j: Job) => j.created_by_id === user?.id);
        setMyJobs(filtered);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch Applicants for a specific job (or loop over all posted jobs)
  const fetchApplicants = async () => {
    setLoadingApplicants(true);
    try {
      if (selectedJobId !== 'all') {
        const response = await fetch(`${API_BASE}/api/jobs/${selectedJobId}/applicants`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setApplicants(data);
        } else {
          setApplicants([]);
        }
      } else {
        // Fetch applicants for ALL jobs owned by manager
        let allApps: Application[] = [];
        for (const job of myJobs) {
          const response = await fetch(`${API_BASE}/api/jobs/${job.id}/applicants`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (response.ok) {
            allApps = [...allApps, ...data];
          }
        }
        // Sort by date applied descending
        allApps.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
        setApplicants(allApps);
      }
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Trigger loads based on active tab and dependencies
  useEffect(() => {
    fetchMyJobs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'applicants' && myJobs.length > 0) {
      fetchApplicants();
    }
  }, [activeTab, selectedJobId, myJobs.length]);

  // Open Add job modal
  const handleOpenAddModal = () => {
    setEditingJob(null);
    setJobTitle('');
    setJobCompany(user?.full_name + "'s Team" || '');
    setJobDesc('');
    setJobReqs('');
    setJobLoc('Remote');
    setJobSal('$100,000 - $130,000');
    setJobType('Full-time');
    setShowJobModal(true);
  };

  // Open Edit job modal
  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobCompany(job.company);
    setJobDesc(job.description);
    setJobReqs(job.requirements || '');
    setJobLoc(job.location);
    setJobSal(job.salary || '');
    setJobType(job.job_type || 'Full-time');
    setShowJobModal(true);
  };

  // Submit Job Creation / Editing
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJob(true);

    const payload = {
      title: jobTitle,
      company: jobCompany,
      description: jobDesc,
      requirements: jobReqs,
      location: jobLoc,
      salary: jobSal,
      job_type: jobType,
      source: 'internal'
    };

    try {
      const url = editingJob 
        ? `${API_BASE}/api/jobs/${editingJob.id}`
        : `${API_BASE}/api/jobs`;
      
      const method = editingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowJobModal(false);
        fetchMyJobs();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to save job opening.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error saving job');
    } finally {
      setSavingJob(false);
    }
  };

  // Delete Job Posting
  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This will remove all associated applications.')) return;

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMyJobs();
      } else {
        const data = await response.json();
        alert(data.detail || 'Delete failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Change Application Status (Applied -> Reviewing -> Interviewing -> Offered -> Rejected)
  const handleChangeStatus = async (appId: number, nextStatus: string) => {
    setUpdatingAppStatus(appId);
    try {
      const response = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local status in lists
        setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(prev => prev ? { ...prev, status: nextStatus } : null);
        }
        alert(`Status updated to ${nextStatus.toUpperCase()}. Check FastAPI logs for mock email confirmation.`);
      } else {
        alert(data.detail || 'Failed to update application status.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingAppStatus(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- TAB 1: MANAGE JOBS --- */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-outfit text-3xl font-bold text-white">Job Openings Manager</h1>
                <p className="text-gray-400 text-sm mt-1">Post, edit, and close listings. View applicant listings below.</p>
              </div>

              {/* Add Job Trigger */}
              <button
                onClick={handleOpenAddModal}
                className="glow-btn inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span>Post a New Job</span>
              </button>
            </div>

            {/* List and Cards */}
            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-400">Loading your active listings...</p>
              </div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                <Briefcase className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-base">No Posted Jobs</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">You haven't posted any job openings yet. Get started by clicking "Post a New Job" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myJobs.map((job) => (
                  <div key={job.id} className="glass-panel p-6 rounded-2xl border border-gray-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-700 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="font-outfit text-lg font-bold text-white leading-none">{job.title}</h3>
                        <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">{job.job_type}</span>
                      </div>
                      <p className="text-sm text-gray-400 font-semibold mt-1.5">{job.company}</p>

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3.5">
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
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-gray-800/50">
                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setActiveTab('applicants');
                        }}
                        className="flex items-center space-x-1.5 bg-gray-900 border border-gray-800 text-xs text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        <span>Applicants</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(job)}
                        className="p-2 border border-gray-800 hover:border-indigo-500/30 bg-gray-900 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 border border-gray-800 hover:border-red-500/30 bg-gray-900 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: APPLICANT TRACKING PIPELINE --- */}
        {activeTab === 'applicants' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-outfit text-3xl font-bold text-white">Applicant Tracking System</h1>
                <p className="text-gray-400 text-sm mt-1">Review student applications, qualifications, and change status.</p>
              </div>

              {/* Job selector dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter Job:</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-gray-950 border border-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Posted Openings</option>
                  {myJobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applicants grid table */}
            {loadingApplicants ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-gray-400">Loading student logs...</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-base">No Applicants Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Students haven't applied to the filtered job openings yet. Check back later!</p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-gray-800/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Job Role</th>
                        <th className="px-6 py-4">Skills Profile</th>
                        <th className="px-6 py-4">Date Applied</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50 text-sm text-gray-300">
                      {applicants.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-900/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{app.student.full_name}</div>
                            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              <span>{app.student.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-200">{app.job.title}</div>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            {app.student.skills ? (
                              <div className="flex flex-wrap gap-1">
                                {app.student.skills.split(',').slice(0, 3).map(s => (
                                  <span key={s} className="bg-gray-950 text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-gray-800">
                                    {s.trim()}
                                  </span>
                                ))}
                                {app.student.skills.split(',').length > 3 && <span className="text-[10px] text-gray-500">+{app.student.skills.split(',').length - 3} more</span>}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 italic">No skills listed</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {new Date(app.applied_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={app.status}
                              disabled={updatingAppStatus === app.id}
                              onChange={(e) => handleChangeStatus(app.id, e.target.value)}
                              className="bg-gray-950 border border-gray-800 text-gray-300 px-2 py-1 rounded text-xs focus:outline-none focus:border-indigo-500 cursor-pointer capitalize disabled:opacity-50"
                            >
                              <option value="applied">Applied</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setShowAppDetailsModal(true);
                              }}
                              className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                            >
                              <Eye className="h-4.5 w-4.5" />
                              <span>Inspect Candidate</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- POP-UP MODAL: CREATE/EDIT JOB FORM --- */}
      <Modal
        isOpen={showJobModal}
        onClose={() => { if (!savingJob) setShowJobModal(false); }}
        title={editingJob ? `Modify: ${editingJob.title}` : 'Post a New Job Opening'}
        maxWidth="xl"
      >
        <form onSubmit={handleJobSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Job Title</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior React Developer"
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Company Name</label>
              <input
                type="text"
                required
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder="e.g. Kalpana Software Pvt Ltd"
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Location</label>
              <input
                type="text"
                required
                value={jobLoc}
                onChange={(e) => setJobLoc(e.target.value)}
                placeholder="e.g. Remote / New York, NY"
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Salary Range Estimate</label>
              <input
                type="text"
                value={jobSal}
                onChange={(e) => setJobSal(e.target.value)}
                placeholder="e.g. $90,000 - $120,000"
                className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Skill keywords CSV */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Skill Requirements Keywords</label>
              <span className="text-[10px] text-gray-500">Comma-separated</span>
            </div>
            <input
              type="text"
              value={jobReqs}
              onChange={(e) => setJobReqs(e.target.value)}
              placeholder="e.g. React, TypeScript, CSS, Git"
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Job Description</label>
            <textarea
              rows={5}
              required
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Provide a detailed description of the roles, responsibilities, projects, and requirements..."
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-800/80 flex justify-end space-x-3">
            <button
              type="button"
              disabled={savingJob}
              onClick={() => setShowJobModal(false)}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingJob}
              className="glow-btn bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {savingJob ? 'Saving Openings...' : editingJob ? 'Update Job Details' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- POP-UP MODAL: INSPECT CANDIDATE DETAILS --- */}
      {selectedApp && (
        <Modal
          isOpen={showAppDetailsModal}
          onClose={() => setShowAppDetailsModal(false)}
          title={`Candidate Profile: ${selectedApp.student.full_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-800/50">
              <div>
                <h3 className="font-outfit text-xl font-bold text-white">{selectedApp.student.full_name}</h3>
                <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedApp.student.email}</span>
                </p>
              </div>

              {/* Status Selector */}
              <div className="flex items-center space-x-2 bg-gray-950 border border-gray-800 p-1.5 rounded-xl text-xs">
                <span className="text-gray-500 font-semibold uppercase tracking-wider pl-1.5">Pipeline:</span>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleChangeStatus(selectedApp.id, e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-gray-200 px-2 py-1 rounded-lg focus:outline-none focus:border-indigo-500 capitalize cursor-pointer font-bold"
                >
                  <option value="applied">Applied</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Candidate Cover Letter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="h-4 w-4" />
                <span>Cover Letter Summary</span>
              </h4>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-line">
                {selectedApp.cover_letter || 'No cover letter provided.'}
              </div>
            </div>

            {/* Candidate Resume Text */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="h-4 w-4" />
                <span>Qualifications & Resume Details</span>
              </h4>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                {selectedApp.resume_text || 'No resume text provided.'}
              </div>
            </div>

            {/* Candidate Declared Skills list */}
            {selectedApp.student.skills && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4" />
                  <span>Declared Skills List</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.student.skills.split(',').map((skill) => (
                    <span key={skill} className="bg-gray-950 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-800 text-xs font-semibold">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-gray-800/80 flex justify-end">
              <button
                onClick={() => setShowAppDetailsModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
