import { useEffect, useState } from "react";
import axios from "axios";

// Candidate interface based of the table schema in Supabase
interface Candidate{
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // get all candidates when ui loads
  const fetchCandidates = async () => {
    try{
      const response = await axios.get(`${API_BASE_URL}/candidates`);
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // handle accept/reject clicks
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // ui updates
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c))

      // send the updated aapplication status to supabase
      await axios.patch(`${API_BASE_URL}/candidates/${id}/status`, { status: newStatus });

    } catch (error) {
      console.error('Error updating status', error);
      // refresh list to reset ui
      fetchCandidates
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading candidates...</div>;
  
  return (
    <div className="min-h-screen p-10">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Assistant</h1>
          <p className="text-gray-500 mt-2">Manage candidate pipelines and trigger automated follow-ups.</p>
        </header>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No candidates found in the database.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${candidate.status === 'successful' ? 'bg-green-100 text-green-800' : ''}
                        ${candidate.status === 'unsuccessful' ? 'bg-red-100 text-red-800' : ''}
                        ${candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}

export default App;