import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import { adminAPI } from '../../services/api';

const AttendancePage = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchWorkers(); }, []);

  useEffect(() => {
    if (selectedWorker) fetchAttendance();
  }, [selectedWorker, month, year]);

  const fetchWorkers = async () => {
    try {
      const response = await adminAPI.getWorkers();
      setWorkers(response.data.workers);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await adminAPI.getAttendance(selectedWorker, { month, year });
      setAttendance(response.data.attendance);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const markAttendance = async (workerId, status) => {
    try {
      const now = new Date();
      await adminAPI.markAttendance({
        worker_id: workerId,
        date: todayDate,
        check_in_time: status === 'present' ? now.toTimeString().slice(0, 8) : null,
        status
      });
      if (selectedWorker) fetchAttendance();
      alert(`Attendance marked: ${status}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-800 mb-6">Attendance Management</h2>

      {/* Quick Mark Today's Attendance */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Mark Today's Attendance ({todayDate})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Worker</th>
                <th className="pb-2">Designation</th>
                <th className="pb-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(worker => (
                <tr key={worker.worker_id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{worker.name}</td>
                  <td className="py-2 text-gray-500">{worker.designation}</td>
                  <td className="py-2">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => markAttendance(worker.worker_id, 'present')}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200 flex items-center gap-1">
                        <FiCheck /> Present
                      </button>
                      <button onClick={() => markAttendance(worker.worker_id, 'absent')}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 flex items-center gap-1">
                        <FiX /> Absent
                      </button>
                      <button onClick={() => markAttendance(worker.worker_id, 'half_day')}
                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-medium hover:bg-yellow-200 flex items-center gap-1">
                        <FiClock /> Half Day
                      </button>
                      <button onClick={() => markAttendance(worker.worker_id, 'leave')}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200">
                        Leave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly View */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Monthly Attendance View</h3>
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Worker</option>
            {workers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-20 px-3 py-2 border rounded-lg text-sm" />
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{summary.present}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.halfDays}</p>
              <p className="text-xs text-gray-500">Half Days</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.leaves}</p>
              <p className="text-xs text-gray-500">Leaves</p>
            </div>
          </div>
        )}

        {attendance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Check In</th>
                  <th className="pb-2">Check Out</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.attendance_id} className="border-b">
                    <td className="py-2">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="py-2">{a.check_in_time || '-'}</td>
                    <td className="py-2">{a.check_out_time || '-'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'present' ? 'bg-green-100 text-green-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">{a.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
