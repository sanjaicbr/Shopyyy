import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cartSummary } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gold-400">CBR</span>
            <span className="text-lg font-light hidden sm:block">Collections</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search dresses, materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full bg-primary-700 border border-primary-600 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-300" />
            </div>
          </form>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/shop" className="hover:text-gold-400 transition">Shop</Link>
            <Link to="/collections" className="hover:text-gold-400 transition">Collections</Link>
            <Link to="/offers" className="hover:text-gold-400 transition">Offers</Link>

            {user ? (
              <>
                <Link to="/cart" className="relative hover:text-gold-400 transition">
                  <FiShoppingCart size={22} />
                  {cartSummary.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartSummary.itemCount}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-gold-400 transition">
                    <FiUser size={20} />
                    <span className="text-sm">{user.name?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">Admin Panel</Link>
                      )}
                      <Link to="/my-orders" className="block px-4 py-2 hover:bg-gray-100">My Orders</Link>
                      <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                      <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Logout</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-gold-400 text-primary-900 px-4 py-2 rounded-full font-medium hover:bg-gold-500 transition">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-primary-700 border border-primary-600 text-white placeholder-gray-300"
              />
            </form>
            <Link to="/shop" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>Shop</Link>
            <Link to="/collections" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>Collections</Link>
            <Link to="/offers" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>Offers</Link>
            {user ? (
              <>
                <Link to="/cart" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>Cart ({cartSummary.itemCount})</Link>
                <Link to="/my-orders" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>My Orders</Link>
                {isAdmin && <Link to="/admin" className="block py-2 hover:text-gold-400" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-red-400">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block py-2 text-gold-400 font-medium" onClick={() => setMenuOpen(false)}>Login / Register</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
