const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all discounts (public - active only)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT discount_id, title, description, discount_type, discount_percent, flat_amount, min_purchase_amount, coupon_code, start_date, end_date
       FROM discounts WHERE is_active = true AND start_date <= NOW() AND end_date >= NOW()
       ORDER BY created_at DESC`
    );
    res.json({ discounts: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discounts.' });
  }
});

// Validate coupon code
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { coupon_code, cart_total } = req.body;

    const result = await pool.query(
      `SELECT * FROM discounts WHERE coupon_code = $1 AND is_active = true AND start_date <= NOW() AND end_date >= NOW() AND (max_uses IS NULL OR used_count < max_uses)`,
      [coupon_code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired coupon code.' });
    }

    const discount = result.rows[0];

    if (cart_total < (discount.min_purchase_amount || 0)) {
      return res.status(400).json({ error: `Minimum purchase of ₹${discount.min_purchase_amount} required.` });
    }

    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = (cart_total * discount.discount_percent) / 100;
    } else if (discount.discount_type === 'flat') {
      discountAmount = discount.flat_amount;
    }

    res.json({
      valid: true,
      discount: {
        title: discount.title,
        type: discount.discount_type,
        amount: parseFloat(discountAmount.toFixed(2)),
        final_total: parseFloat((cart_total - discountAmount).toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon.' });
  }
});

// Create discount (Admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, discount_type, discount_percent, flat_amount, min_purchase_amount, coupon_code, applicable_departments, applicable_categories, start_date, end_date, max_uses } = req.body;

    const result = await pool.query(
      `INSERT INTO discounts (title, description, discount_type, discount_percent, flat_amount, min_purchase_amount, coupon_code, applicable_departments, applicable_categories, start_date, end_date, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [title, description, discount_type, discount_percent, flat_amount, min_purchase_amount || 0, coupon_code, applicable_departments, applicable_categories, start_date, end_date, max_uses]
    );

    res.status(201).json({ discount: result.rows[0] });
  } catch (error) {
    console.error('Discount creation error:', error);
    res.status(500).json({ error: 'Failed to create discount.' });
  }
});

// Update discount (Admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, discount_type, discount_percent, flat_amount, min_purchase_amount, start_date, end_date, is_active, max_uses } = req.body;

    const result = await pool.query(
      `UPDATE discounts SET 
        title = COALESCE($1, title), description = COALESCE($2, description),
        discount_type = COALESCE($3, discount_type), discount_percent = COALESCE($4, discount_percent),
        flat_amount = COALESCE($5, flat_amount), min_purchase_amount = COALESCE($6, min_purchase_amount),
        start_date = COALESCE($7, start_date), end_date = COALESCE($8, end_date),
        is_active = COALESCE($9, is_active), max_uses = COALESCE($10, max_uses)
       WHERE discount_id = $11 RETURNING *`,
      [title, description, discount_type, discount_percent, flat_amount, min_purchase_amount, start_date, end_date, is_active, max_uses, req.params.id]
    );

    res.json({ discount: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update discount.' });
  }
});

// Delete discount (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE discounts SET is_active = false WHERE discount_id = $1', [req.params.id]);
    res.json({ message: 'Discount deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete discount.' });
  }
});

module.exports = router;
