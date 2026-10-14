import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://mandybackend-kappa.vercel.app';

export default function ApplicantForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload a CV');
    
    setIsSubmitting(true);
    setSuccessMsg('');

    // FormData is required for sending files via HTTP POST
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('role', role);
    formData.append('cv_file', file);

    try {
      await axios.post(`${API_BASE_URL}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Application submitted!, Thank you for choosing Origami we will reach out to you soon.');
      setName(''); setEmail(''); setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Apply for a Role</h2>
      
      {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} 
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2">
            <option>Frontend Developer</option>
            <option>Backend Engineer</option>
            <option>AI Engineer</option>
            <option>Data Engineer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload CV (PDF)</label>
          <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files?.[0] || null)} 
                 className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" />
        </div>
        <button type="submit" disabled={isSubmitting} 
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {isSubmitting ? 'Evaluating CV...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}