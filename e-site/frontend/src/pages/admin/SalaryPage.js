import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const SalaryPage = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [monthYear, setMonthYear] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [formData, setFormData] = useState({ overtime_hours: 0, incentive: 0, deductions: 0 });

  useEffect(() => { fetchWorkers(); }, []);

  useEffect(() => {
    if (selectedWorker) fetchSalaryHistory();
  }, [selectedWorker]);

  const fetchWorkers = async () => {
    try {
      const response = await adminAPI.getWorkers();
      setWorkers(response.data.workers);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const response = await adminAPI.getSalaryHistory(selectedWorker);
      setSalaryHistory(response.data.salaries);
    } catch (error) {
      console.error('Failed to fetch salary history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedWorker) return alert('Select a worker');
    try {
      const [year, month] = monthYear.split('-');
      await adminAPI.generateSalary({
        worker_id: parseInt(selectedWorker),
        month_year: `${month}-${year}`,
        ...formData
      });
      fetchSalaryHistory();
      alert('Salary generated successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to generate salary');
    }
  };

  const handleMarkPaid = async (salaryId) => {
    const mode = prompt('Payment mode (cash/upi/bank_transfer):');
    if (mode) {
      try {
        await adminAPI.markSalaryPaid(salaryId, mode);
        fetchSalaryHistory();
      } catch (error) {
        alert('Failed to update payment status');
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-800 mb-6">Salary & Payroll</h2>

      {/* Generate Salary */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Generate Salary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Worker</option>
            {workers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name}</option>)}
          </select>
          <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="OT Hours" value={formData.overtime_hours}
            onChange={(e) => setFormData({...formData, overtime_hours: parseFloat(e.target.value) || 0})}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Incentive ₹" value={formData.incentive}
            onChange={(e) => setFormData({...formData, incentive: parseFloat(e.target.value) || 0})}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Deductions ₹" value={formData.deductions}
            onChange={(e) => setFormData({...formData, deductions: parseFloat(e.target.value) || 0})}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={handleGenerate} className="mt-3 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          Generate Salary
        </button>
      </div>

      {/* Salary History */}
      {selectedWorker && salaryHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Salary History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Month</th>
                  <th className="pb-2">Working Days</th>
                  <th className="pb-2">Leaves</th>
                  <th className="pb-2">OT Bonus</th>
                  <th className="pb-2">Incentive</th>
                  <th className="pb-2">Deductions</th>
                  <th className="pb-2">Net Salary</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.map(s => (
                  <tr key={s.salary_id} className="border-b">
                    <td className="py-2 font-medium">{s.month_year}</td>
                    <td className="py-2">{s.working_days}/{s.total_days}</td>
                    <td className="py-2">{s.leaves_taken}</td>
                    <td className="py-2">₹{parseFloat(s.overtime_bonus).toFixed(0)}</td>
                    <td className="py-2">₹{parseFloat(s.incentive).toFixed(0)}</td>
                    <td className="py-2 text-red-500">-₹{parseFloat(s.deductions).toFixed(0)}</td>
                    <td className="py-2 font-bold text-primary-700">₹{parseFloat(s.net_salary).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="py-2">
                      {s.payment_status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(s.salary_id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
