import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-primary-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h3 className="text-2xl font-bold text-gold-400 mb-4">CBR Collections</h3>
          <p className="text-sm leading-relaxed">
            Your premium destination for quality textiles and ready-made garments.
            Explore our curated collections for men, women, and kids.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop?department=men" className="hover:text-gold-400 transition">Men's Wear</Link></li>
            <li><Link to="/shop?department=women" className="hover:text-gold-400 transition">Women's Wear</Link></li>
            <li><Link to="/shop?department=kids" className="hover:text-gold-400 transition">Kids Wear</Link></li>
            <li><Link to="/collections" className="hover:text-gold-400 transition">New Arrivals</Link></li>
            <li><Link to="/offers" className="hover:text-gold-400 transition">Offers & Deals</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="text-white font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold-400 transition">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-gold-400 transition">Contact Us</Link></li>
            <li><Link to="/shipping" className="hover:text-gold-400 transition">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-gold-400 transition">Returns & Exchange</Link></li>
            <li><Link to="/privacy" className="hover:text-gold-400 transition">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><FiMapPin /> CBR Collections, Main Road, Tamil Nadu</li>
            <li className="flex items-center gap-2"><FiPhone /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><FiMail /> info@cbrcollections.com</li>
          </ul>
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-gold-400 transition" aria-label="Instagram"><FiInstagram size={20} /></a>
            <a href="#" className="hover:text-gold-400 transition" aria-label="Facebook"><FiFacebook size={20} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-700 py-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} CBR Collections. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
