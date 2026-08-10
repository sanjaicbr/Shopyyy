import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiPercent, FiRefreshCw } from 'react-icons/fi';

const HomePage = () => {
  const categories = [
    { name: "Men's Wear", image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400", link: "/shop?department=men" },
    { name: "Women's Wear", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400", link: "/shop?department=women" },
    { name: "Kids Wear", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400", link: "/shop?department=kids" },
    { name: "Textiles & Fabrics", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400", link: "/shop?category=fabric" },
  ];

  const features = [
    { icon: <FiShoppingBag />, title: "Wide Collection", desc: "1000+ styles across all categories" },
    { icon: <FiTruck />, title: "Free Delivery", desc: "Free shipping on orders above ₹999" },
    { icon: <FiPercent />, title: "Best Offers", desc: "Up to 50% off on seasonal collections" },
    { icon: <FiRefreshCw />, title: "Easy Returns", desc: "7-day hassle-free returns" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-800 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Style That <span className="text-gold-400">Speaks</span> For You
            </h1>
            <p className="text-lg text-gray-300 max-w-lg">
              Discover premium textiles and ready-made garments at CBR Collections. 
              From traditional to trendy — we've got your style covered.
            </p>
            <div className="flex gap-4">
              <Link to="/shop" className="bg-gold-400 text-primary-900 px-8 py-3 rounded-full font-semibold hover:bg-gold-500 transition shadow-lg">
                Shop Now
              </Link>
              <Link to="/collections" className="border-2 border-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-primary-900 transition">
                New Arrivals
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
            <div className="w-80 h-80 bg-gradient-to-br from-gold-400 to-accent-500 rounded-full opacity-20 blur-3xl absolute"></div>
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500"
              alt="Fashion"
              className="relative rounded-2xl shadow-2xl w-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-primary-600 text-2xl">{f.icon}</div>
              <div>
                <h4 className="font-semibold text-sm">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link key={i} to={cat.link} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition">
              <img src={cat.image} alt={cat.name} className="w-full h-60 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-100 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-primary-800 mb-4">New Season, New Style</h2>
          <p className="text-gray-600 mb-8">Explore our latest collection with exclusive designs. Fresh arrivals every week!</p>
          <Link to="/shop?is_new_collection=true" className="bg-primary-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-800 transition">
            View New Arrivals
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
