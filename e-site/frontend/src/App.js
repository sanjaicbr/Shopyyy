import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ShopPage from './pages/customer/ShopPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import LoginPage from './pages/customer/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import WorkersPage from './pages/admin/WorkersPage';
import AttendancePage from './pages/admin/AttendancePage';
import SalaryPage from './pages/admin/SalaryPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

// Protected Route for authenticated users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

const AppContent = () => {
  const { isAdmin } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Public / Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/collections" element={<ShopPage />} />
          <Route path="/offers" element={<ShopPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Customer Routes */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
            <Route path="workers" element={<WorkersPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
              <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
            </div>
          } />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
