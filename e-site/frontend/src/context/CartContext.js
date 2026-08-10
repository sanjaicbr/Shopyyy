import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({ itemCount: 0, subtotal: 0 });
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      setCartSummary({ itemCount: 0, subtotal: 0 });
      return;
    }
    try {
      const response = await cartAPI.get();
      setCartItems(response.data.items);
      setCartSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (variantId, quantity = 1) => {
    await cartAPI.add(variantId, quantity);
    await fetchCart();
  };

  const updateQuantity = async (cartId, quantity) => {
    await cartAPI.update(cartId, quantity);
    await fetchCart();
  };

  const removeItem = async (cartId) => {
    await cartAPI.remove(cartId);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartAPI.clear();
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{ cartItems, cartSummary, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
