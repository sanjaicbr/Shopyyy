import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { adminAPI } from '../../services/api';

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    designation: '', department: '', base_salary: '',
    salary_type: 'monthly', joining_date: '', emergency_contact: '', address: ''
  });

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    try {
      const response = await adminAPI.getWorkers();
      setWorkers(response.data.workers);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await adminAPI.updateWorker(editingWorker.worker_id, formData);
      } else {
        await adminAPI.addWorker(formData);
      }
      fetchWorkers();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save worker');
    }
  };

  const handleDelete = async (workerId) => {
    if (window.confirm('Deactivate this worker?')) {
      await adminAPI.deleteWorker(workerId);
      fetchWorkers();
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name, email: worker.email, phone: worker.phone, password: '',
      designation: worker.designation, department: worker.department,
      base_salary: worker.base_salary, salary_type: worker.salary_type,
      joining_date: worker.joining_date?.split('T')[0], emergency_contact: worker.emergency_contact, address: worker.address
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingWorker(null);
    setFormData({ name: '', email: '', phone: '', password: '', designation: '', department: '', base_salary: '', salary_type: 'monthly', joining_date: '', emergency_contact: '', address: '' });
  };

  const filteredWorkers = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.designation?.toLowerCase().includes(search.toLowerCase()) ||
    w.employee_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary-800">Workers Management</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
          <FiPlus /> Add Worker
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input type="text" placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Joining</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(worker => (
              <tr key={worker.worker_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{worker.employee_code}</td>
                <td className="px-4 py-3 font-medium">{worker.name}</td>
                <td className="px-4 py-3">{worker.designation}</td>
                <td className="px-4 py-3">{worker.department}</td>
                <td className="px-4 py-3">₹{worker.base_salary} <span className="text-xs text-gray-400">/{worker.salary_type === 'monthly' ? 'mo' : 'day'}</span></td>
                <td className="px-4 py-3 text-gray-500">{worker.joining_date ? new Date(worker.joining_date).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(worker)} className="text-blue-500 hover:text-blue-700"><FiEdit /></button>
                    <button onClick={() => handleDelete(worker.worker_id)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredWorkers.length === 0 && <p className="text-center py-8 text-gray-400">No workers found.</p>}
      </div>

      {/* Add/Edit Worker Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-primary-800 mb-4">{editingWorker ? 'Edit Worker' : 'Add New Worker'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                {!editingWorker && (
                  <div>
                    <label className="text-xs text-gray-600">Password</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Default: cbr@123" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-600">Designation *</label>
                  <input type="text" required value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Sales Associate" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Department</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Sales" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Base Salary (₹) *</label>
                  <input type="number" required value={formData.base_salary} onChange={(e) => setFormData({...formData, base_salary: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Salary Type</label>
                  <select value={formData.salary_type} onChange={(e) => setFormData({...formData, salary_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Joining Date</label>
                  <input type="date" value={formData.joining_date} onChange={(e) => setFormData({...formData, joining_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Emergency Contact</label>
                  <input type="tel" value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700">
                  {editingWorker ? 'Update Worker' : 'Add Worker'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
