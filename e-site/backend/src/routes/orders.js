const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order from cart
router.post('/create', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { address_id, payment_mode = 'online', coupon_code } = req.body;

    // Fetch cart items
    const cartResult = await client.query(`
      SELECT c.variant_id, c.quantity, pv.selling_price, pv.stock_quantity, p.title, pv.size, pv.color
      FROM cart c
      JOIN product_variants pv ON c.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE c.user_id = $1
    `, [req.user.userId]);

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Verify stock availability
    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${item.title} (${item.size}, ${item.color}).` });
      }
    }

    // Calculate totals
    let subtotal = cartResult.rows.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    let discountAmount = 0;

    // Apply coupon if provided
    if (coupon_code) {
      const coupon = await client.query(
        `SELECT * FROM discounts WHERE coupon_code = $1 AND is_active = true AND start_date <= NOW() AND end_date >= NOW() AND (max_uses IS NULL OR used_count < max_uses)`,
        [coupon_code]
      );
      if (coupon.rows.length > 0) {
        const discount = coupon.rows[0];
        if (subtotal >= (discount.min_purchase_amount || 0)) {
          if (discount.discount_type === 'percentage') {
            discountAmount = (subtotal * discount.discount_percent) / 100;
          } else if (discount.discount_type === 'flat') {
            discountAmount = discount.flat_amount;
          }
          // Update coupon usage
          await client.query('UPDATE discounts SET used_count = used_count + 1 WHERE discount_id = $1', [discount.discount_id]);
        }
      }
    }

    const taxAmount = (subtotal - discountAmount) * 0.05; // 5% GST
    const shippingAmount = subtotal >= 999 ? 0 : 49; // Free shipping over ₹999
    const finalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

    // Generate order number
    const orderNumber = `CBR-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, order_type, subtotal, discount_amount, tax_amount, shipping_amount, final_amount, payment_mode, shipping_address_id)
       VALUES ($1, $2, 'online', $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [orderNumber, req.user.userId, subtotal, discountAmount, taxAmount, shippingAmount, finalAmount, payment_mode, address_id]
    );

    const order = orderResult.rows[0];

    // Insert order items and reduce stock
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, product_title, size, color, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [order.order_id, item.variant_id, item.title, item.size, item.color, item.quantity, item.selling_price, item.selling_price * item.quantity]
      );

      // Reduce stock
      await client.query(
        'UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE variant_id = $2',
        [item.quantity, item.variant_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);

    await client.query('COMMIT');

    // Create Razorpay order for online payment
    let razorpayOrder = null;
    if (payment_mode === 'online') {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // Amount in paise
        currency: 'INR',
        receipt: orderNumber,
        notes: { order_id: order.order_id.toString() }
      });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        ...order,
        items: cartResult.rows
      },
      razorpay_order: razorpayOrder ? {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      } : null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  } finally {
    client.release();
  }
});

// Verify Razorpay payment
router.post('/verify-payment', authenticate, async (req, res) => {
  try {
    const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const crypto = require('crypto');

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await pool.query(
        `UPDATE orders SET payment_status = 'paid', payment_id = $1, order_status = 'confirmed' WHERE order_id = $2`,
        [razorpay_payment_id, order_id]
      );
      res.json({ message: 'Payment verified successfully', status: 'paid' });
    } else {
      await pool.query(`UPDATE orders SET payment_status = 'failed' WHERE order_id = $1`, [order_id]);
      res.status(400).json({ error: 'Payment verification failed.' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

// Get customer orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY order_date DESC`,
      [req.user.userId]
    );

    // Fetch items for each order
    for (let order of orders.rows) {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.order_id]);
      order.items = items.rows;
    }

    res.json({ orders: orders.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Get single order details
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1 AND customer_id = $2',
      [req.params.orderId, req.user.userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.orderId]);

    res.json({ order: { ...order.rows[0], items: items.rows } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

// Cancel order (customer)
router.put('/:orderId/cancel', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND customer_id = $2 AND order_status IN ('placed', 'confirmed')`,
      [req.params.orderId, req.user.userId]
    );

    if (order.rows.length === 0) {
      return res.status(400).json({ error: 'Order cannot be cancelled.' });
    }

    // Restore stock
    const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.orderId]);
    for (const item of items.rows) {
      await client.query(
        'UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE variant_id = $2',
        [item.quantity, item.variant_id]
      );
    }

    await client.query(
      `UPDATE orders SET order_status = 'cancelled', payment_status = 'refunded' WHERE order_id = $1`,
      [req.params.orderId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to cancel order.' });
  } finally {
    client.release();
  }
});

module.exports = router;
