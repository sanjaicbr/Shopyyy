import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await orderAPI.cancel(orderId);
        fetchOrders();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to cancel order');
      }
    }
  };

  const statusColors = {
    placed: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-gray-100 text-gray-700',
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">Loading orders...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/shop" className="bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.order_id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">Order #{order.order_number}</p>
                  <p className="text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[order.order_status]}`}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </span>
                  <p className="font-bold text-primary-700 mt-1">₹{order.final_amount}</p>
                </div>
              </div>

              {/* Items */}
              {order.items && (
                <div className="border-t pt-3 space-y-2">
                  {order.items.map(item => (
                    <div key={item.order_item_id} className="flex justify-between text-sm text-gray-600">
                      <span>{item.product_title} ({item.size}, {item.color}) × {item.quantity}</span>
                      <span>₹{item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {['placed', 'confirmed'].includes(order.order_status) && (
                <div className="mt-3 border-t pt-3">
                  <button onClick={() => handleCancel(order.order_id)} className="text-sm text-red-600 hover:text-red-800 font-medium">
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
