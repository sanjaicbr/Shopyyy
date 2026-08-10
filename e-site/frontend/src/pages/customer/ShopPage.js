import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiGrid, FiList, FiHeart } from 'react-icons/fi';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    department: searchParams.get('department') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    size: searchParams.get('size') || '',
    search: searchParams.get('search') || '',
    sort_by: searchParams.get('sort_by') || 'newest',
    is_new_collection: searchParams.get('is_new_collection') || '',
    page: 1,
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const response = await productAPI.getAll(params);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleAddToCart = async (variantId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await addToCart(variantId);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const departments = [
    { value: '', label: 'All' },
    { value: 'men', label: "Men's" },
    { value: 'women', label: "Women's" },
    { value: 'kids', label: "Kids" },
    { value: 'unisex', label: "Unisex" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-800">
          {filters.search ? `Results for "${filters.search}"` : 'All Products'}
        </h1>
        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden flex items-center gap-2 text-primary-600 border border-primary-200 px-3 py-2 rounded-lg">
          <FiFilter /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 space-y-6`}>
          {/* Department */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Department</h3>
            <div className="space-y-1">
              {departments.map(d => (
                <button key={d.value} onClick={() => handleFilterChange('department', d.value)}
                  className={`block w-full text-left px-3 py-1.5 rounded text-sm ${filters.department === d.value ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map(s => (
                <button key={s} onClick={() => handleFilterChange('size', filters.size === s ? '' : s)}
                  className={`px-3 py-1 rounded border text-sm ${filters.size === s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Price Range</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.min_price} onChange={(e) => handleFilterChange('min_price', e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm" />
              <input type="number" placeholder="Max" value={filters.max_price} onChange={(e) => handleFilterChange('max_price', e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm" />
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Sort By</h3>
            <select value={filters.sort_by} onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm">
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button onClick={() => setFilters({ department: '', category: '', brand: '', min_price: '', max_price: '', size: '', search: '', sort_by: 'newest', is_new_collection: '', page: 1 })}
            className="text-sm text-red-500 hover:text-red-700">
            Clear All Filters
          </button>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64"></div>
                  <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(product => {
                  const firstVariant = product.variants?.[0] || {};
                  return (
                    <div key={product.product_id} className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden border border-gray-100">
                      <Link to={`/product/${product.product_id}`} className="block relative">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=CBR+Collections'}
                          alt={product.title}
                          className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                        />
                        {product.is_new_collection && (
                          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">New</span>
                        )}
                      </Link>
                      <div className="p-4">
                        <p className="text-xs text-gray-400 uppercase">{product.brand}</p>
                        <Link to={`/product/${product.product_id}`}>
                          <h3 className="font-medium text-gray-800 mt-1 line-clamp-2 hover:text-primary-600">{product.title}</h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-primary-700">₹{firstVariant.selling_price || product.min_price}</span>
                          {firstVariant.mrp && firstVariant.mrp > firstVariant.selling_price && (
                            <span className="text-sm text-gray-400 line-through">₹{firstVariant.mrp}</span>
                          )}
                        </div>
                        <button onClick={() => handleAddToCart(firstVariant.variant_id)}
                          className="mt-3 w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-10 gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button key={i} onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                      className={`px-4 py-2 rounded ${filters.page === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;
