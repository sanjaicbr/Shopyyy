const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all suppliers (Admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE is_active = true ORDER BY company_name');
    res.json({ suppliers: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers.' });
  }
});

// Add supplier (Admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { company_name, contact_person, phone, email, address, city, state, supply_categories, gst_number, credit_period_days } = req.body;

    const result = await pool.query(
      `INSERT INTO suppliers (company_name, contact_person, phone, email, address, city, state, supply_categories, gst_number, credit_period_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [company_name, contact_person, phone, email, address, city, state, supply_categories, gst_number, credit_period_days || 30]
    );

    res.status(201).json({ supplier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add supplier.' });
  }
});

// Update supplier (Admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { company_name, contact_person, phone, email, address, city, state, supply_categories, gst_number, credit_period_days } = req.body;

    const result = await pool.query(
      `UPDATE suppliers SET 
        company_name = COALESCE($1, company_name), contact_person = COALESCE($2, contact_person),
        phone = COALESCE($3, phone), email = COALESCE($4, email),
        address = COALESCE($5, address), city = COALESCE($6, city), state = COALESCE($7, state),
        supply_categories = COALESCE($8, supply_categories), gst_number = COALESCE($9, gst_number),
        credit_period_days = COALESCE($10, credit_period_days)
       WHERE supplier_id = $11 RETURNING *`,
      [company_name, contact_person, phone, email, address, city, state, supply_categories, gst_number, credit_period_days, req.params.id]
    );

    res.json({ supplier: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier.' });
  }
});

// Delete supplier (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE suppliers SET is_active = false WHERE supplier_id = $1', [req.params.id]);
    res.json({ message: 'Supplier removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove supplier.' });
  }
});

// ==================== PURCHASE ORDERS ====================

// Get all POs
router.get('/purchase-orders', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT po.*, s.company_name as supplier_name 
      FROM purchase_orders po 
      JOIN suppliers s ON po.supplier_id = s.supplier_id
      ORDER BY po.created_at DESC
    `);
    res.json({ purchaseOrders: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders.' });
  }
});

// Create Purchase Order
router.post('/purchase-orders', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { supplier_id, items, expected_delivery, notes } = req.body;
    const { v4: uuidv4 } = require('uuid');

    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    let totalAmount = 0;

    const poResult = await client.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, total_amount, expected_delivery, notes)
       VALUES ($1, $2, 0, $3, $4) RETURNING *`,
      [poNumber, supplier_id, expected_delivery, notes]
    );

    const po = poResult.rows[0];

    for (const item of items) {
      const itemTotal = item.quantity * item.unit_cost;
      totalAmount += itemTotal;
      await client.query(
        `INSERT INTO purchase_order_items (po_id, product_id, variant_id, quantity, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [po.po_id, item.product_id, item.variant_id, item.quantity, item.unit_cost, itemTotal]
      );
    }

    await client.query('UPDATE purchase_orders SET total_amount = $1 WHERE po_id = $2', [totalAmount, po.po_id]);

    await client.query('COMMIT');
    res.status(201).json({ purchaseOrder: { ...po, total_amount: totalAmount } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create purchase order.' });
  } finally {
    client.release();
  }
});

module.exports = router;
