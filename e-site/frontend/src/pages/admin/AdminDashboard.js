import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiGrid, FiPackage, FiUsers, FiCalendar, FiDollarSign, FiTruck, FiTag, FiBarChart2, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMainDashboard = location.pathname === '/admin';

  useEffect(() => {
    if (isMainDashboard) fetchDashboard();
  }, [isMainDashboard]);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const navItems = [
    { path: '/admin', icon: <FiGrid />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FiPackage />, label: 'Products' },
    { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
    { path: '/admin/workers', icon: <FiUsers />, label: 'Workers' },
    { path: '/admin/attendance', icon: <FiCalendar />, label: 'Attendance' },
    { path: '/admin/salary', icon: <FiDollarSign />, label: 'Salary' },
    { path: '/admin/suppliers', icon: <FiTruck />, label: 'Suppliers' },
    { path: '/admin/discounts', icon: <FiTag />, label: 'Discounts' },
    { path: '/admin/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static z-40 w-64 bg-primary-900 text-white h-full transition-transform`}>
        <div className="p-4 border-b border-primary-700 flex items-center justify-between">
          <h2 className="font-bold text-gold-400">Admin Panel</h2>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${location.pathname === item.path ? 'bg-primary-700 text-gold-400' : 'text-gray-300 hover:bg-primary-800 hover:text-white'}`}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4 md:p-8 overflow-auto">
        <button className="md:hidden mb-4 text-primary-700" onClick={() => setSidebarOpen(true)}>
          <FiMenu size={24} />
        </button>

        {isMainDashboard ? (
          <div>
            <h1 className="text-2xl font-bold text-primary-800 mb-6">Dashboard Overview</h1>

            {stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{parseFloat(stats.today.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{stats.today.order_count} orders</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-primary-700">₹{parseFloat(stats.monthly.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{stats.monthly.order_count} orders</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.products.total_products}</p>
                    <p className="text-xs text-red-500">{stats.products.low_stock_count} low stock</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Active Workers</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.workers}</p>
                    <p className="text-xs text-orange-500">{stats.pendingOrders} pending orders</p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-3">Order #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders?.map(order => (
                          <tr key={order.order_id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{order.order_number}</td>
                            <td className="py-3">{order.customer_name || 'Walk-in'}</td>
                            <td className="py-3 font-medium">₹{order.final_amount}</td>
                            <td className="py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {order.order_status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500">{new Date(order.order_date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
