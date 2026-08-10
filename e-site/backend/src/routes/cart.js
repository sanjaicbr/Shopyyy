const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get cart items
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.cart_id, c.quantity, c.variant_id,
        pv.size, pv.color, pv.selling_price, pv.mrp, pv.stock_quantity, pv.sku_code,
        p.product_id, p.title, p.brand, p.images, p.department, p.category
      FROM cart c
      JOIN product_variants pv ON c.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.userId]);

    const cartItems = result.rows;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

    res.json({ 
      items: cartItems, 
      summary: {
        itemCount: cartItems.length,
        subtotal: parseFloat(subtotal.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// Add to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { variant_id, quantity = 1 } = req.body;

    // Check stock availability
    const variant = await pool.query('SELECT stock_quantity FROM product_variants WHERE variant_id = $1', [variant_id]);
    if (variant.rows.length === 0) {
      return res.status(404).json({ error: 'Product variant not found.' });
    }
    if (variant.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available.' });
    }

    // Upsert cart item
    const result = await pool.query(`
      INSERT INTO cart (user_id, variant_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, variant_id) 
      DO UPDATE SET quantity = cart.quantity + $3
      RETURNING *
    `, [req.user.userId, variant_id, quantity]);

    res.json({ message: 'Item added to cart', item: result.rows[0] });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});

// Update cart item quantity
router.put('/:cartId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { cartId } = req.params;

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart WHERE cart_id = $1 AND user_id = $2', [cartId, req.user.userId]);
      return res.json({ message: 'Item removed from cart.' });
    }

    const result = await pool.query(
      'UPDATE cart SET quantity = $1 WHERE cart_id = $2 AND user_id = $3 RETURNING *',
      [quantity, cartId, req.user.userId]
    );

    res.json({ item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// Remove from cart
router.delete('/:cartId', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE cart_id = $1 AND user_id = $2', [req.params.cartId, req.user.userId]);
    res.json({ message: 'Item removed from cart.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item.' });
  }
});

// Clear entire cart
router.delete('/', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

module.exports = router;
