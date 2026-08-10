import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchAnalytics(); }, [year]);

  const fetchAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics({ year });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyChartData = months.map((m, i) => {
    const data = analytics?.monthlySales?.find(s => parseInt(s.month) === i + 1);
    return { name: m, revenue: data ? parseFloat(data.revenue) : 0, orders: data ? parseInt(data.orders) : 0 };
  });

  // YoY comparison
  const yoyData = months.map((m, i) => {
    const current = analytics?.yoyComparison?.find(s => parseInt(s.month) === i + 1 && parseInt(s.year) === year);
    const prev = analytics?.yoyComparison?.find(s => parseInt(s.month) === i + 1 && parseInt(s.year) === year - 1);
    return { name: m, [`${year}`]: current ? parseFloat(current.revenue) : 0, [`${year - 1}`]: prev ? parseFloat(prev.revenue) : 0 };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary-800">Sales Analytics</h2>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {analytics ? (
        <div className="space-y-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue ({year})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* YoY Comparison */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Year-over-Year Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey={`${year}`} stroke="#2563eb" strokeWidth={2} name={`${year}`} />
                <Line type="monotone" dataKey={`${year - 1}`} stroke="#9ca3af" strokeWidth={2} name={`${year - 1}`} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Sales */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Category Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Items Sold</th>
                    <th className="pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.categorySales?.map((cat, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-medium">{cat.category}</td>
                      <td className="py-2 capitalize">{cat.department}</td>
                      <td className="py-2">{cat.items_sold}</td>
                      <td className="py-2 font-medium text-primary-700">₹{parseFloat(cat.revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.categorySales?.length === 0 && <p className="text-center py-4 text-gray-400">No sales data for this year.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">Loading analytics...</div>
      )}
    </div>
  );
};

export default AnalyticsPage;
