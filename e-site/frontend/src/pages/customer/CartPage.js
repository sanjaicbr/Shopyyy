import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiTag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { discountAPI } from '../../services/api';

const CartPage = () => {
  const { cartItems, cartSummary, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = async () => {
    setCouponError('');
    setDiscount(null);
    try {
      const response = await discountAPI.validate(couponCode, cartSummary.subtotal);
      setDiscount(response.data.discount);
    } catch (error) {
      setCouponError(error.response?.data?.error || 'Invalid coupon code');
    }
  };

  const finalTotal = discount ? discount.final_total : cartSummary.subtotal;
  const shippingCharge = finalTotal >= 999 ? 0 : 49;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Start shopping to add items to your cart.</p>
        <Link to="/shop" className="bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-800 mb-6">Shopping Cart ({cartSummary.itemCount} items)</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div key={item.cart_id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <img
                src={item.images?.[0] || 'https://via.placeholder.com/100?text=CBR'}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <Link to={`/product/${item.product_id}`} className="font-medium text-gray-800 hover:text-primary-600">
                  {item.title}
                </Link>
                <p className="text-sm text-gray-500">{item.brand} • {item.size} • {item.color}</p>
                <p className="font-bold text-primary-700 mt-1">₹{item.selling_price}</p>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 border rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-gray-100"><FiMinus size={14} /></button>
                    <span className="px-2 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-gray-100"><FiPlus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.cart_id)}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                    <FiTrash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">₹{(item.selling_price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit sticky top-20">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Order Summary</h3>

          {/* Coupon */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiTag className="absolute left-3 top-3 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button onClick={handleApplyCoupon} className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-200">
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            {discount && <p className="text-green-600 text-xs mt-1">✓ {discount.title} — You save ₹{discount.amount}</p>}
          </div>

          <div className="space-y-3 text-sm border-t pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{cartSummary.subtotal.toFixed(2)}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{discount.amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingCharge === 0 ? <span className="text-green-600">FREE</span> : `₹${shippingCharge}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>₹{(finalTotal * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>₹{(finalTotal + shippingCharge + finalTotal * 0.05).toFixed(2)}</span>
            </div>
          </div>

          <button onClick={() => navigate('/checkout')}
            className="w-full mt-6 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition">
            Proceed to Checkout
          </button>

          <Link to="/shop" className="block text-center text-primary-600 text-sm mt-3 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
