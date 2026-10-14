import { useEffect, useState } from 'react';
import axios from 'axios';
import ApplicantForm from './ApplicationForm';
import React from 'react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  ats_score?: number;
  match_summary?: string;
  strenghts?: string[];
  weaknesses?: string[];
}

const API_BASE_URL = "https://mandybackend-kappa.vercel.app";

function App() {
  const [currentView, setCurrentView] = useState<'recruiter' | 'applicant'>('recruiter');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/candidates`);
      // Sort so newest or pending candidates are at the top (optional depending on your Supabase default)
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever we switch back to the recruiter view
  useEffect(() => {
    if (currentView === 'recruiter') {
      fetchCandidates();
    }
  }, [currentView]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
      await axios.patch(`${API_BASE_URL}/candidates/${id}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      fetchCandidates();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="min-h-screen p-10 bg-slate-50">
      
      {/* Top Navigation Toggle */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-end gap-4">
        <button 
          onClick={() => setCurrentView('applicant')} 
          className={`px-4 py-2 rounded-md font-medium transition-colors ${currentView === 'applicant' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Applicant Portal
        </button>
        <button 
          onClick={() => setCurrentView('recruiter')} 
          className={`px-4 py-2 rounded-md font-medium transition-colors ${currentView === 'recruiter' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Recruiter Dashboard
        </button>
      </div>

      {/* Main Content Area */}
      {currentView === 'applicant' ? (
        <ApplicantForm />
      ) : (
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Origami Recruitment Assistant</h1>
            <p className="text-gray-500 mt-2">Welcome back, Recruitment. Here are your latest AI-scored candidates.</p>
          </header>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ATS Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading candidates...</td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No candidates found in the database.</td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <React.Fragment key={candidate.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                          <div className="text-sm text-gray-500">{candidate.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {candidate.ats_score !== undefined && candidate.ats_score !== null ? (
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold
                              ${candidate.ats_score >= 80 ? 'bg-green-100 text-green-800' : 
                                candidate.ats_score >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {candidate.ats_score}/100
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not scored</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${candidate.status === 'successful' ? 'bg-green-100 text-green-800' : ''}
                            ${candidate.status === 'unsuccessful' ? 'bg-red-100 text-red-800' : ''}
                            ${candidate.status === 'pending' ? 'bg-blue-100 text-blue-800' : ''}
                          `}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => toggleExpand(candidate.id)}
                            className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-1 mr-2"
                          >
                            {expandedRow === candidate.id ? 'Hide Analysis' : 'View AI Analysis'}
                          </button>
                          <button 
                            onClick={() => updateStatus(candidate.id, 'successful')}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md mr-2 transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => updateStatus(candidate.id, 'unsuccessful')}
                            className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable AI Analysis Row */}
                      {expandedRow === candidate.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={4} className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-bold text-gray-900 mb-2">AI Match Summary</h4>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
                                  {candidate.match_summary || "No summary available."}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-bold text-green-700 mb-2">Strenghts</h4>
                                  <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                                    {candidate.strenghts?.map((strenght, i) => (
                                      <li key={i}>{strenght}</li>
                                    )) || <li>None recorded</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-bold text-red-700 mb-2">Missing / Weaknesses</h4>
                                  <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                                    {candidate.weaknesses?.map((weakness, i) => (
                                      <li key={i}>{weakness}</li>
                                    )) || <li>None recorded</li>}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;