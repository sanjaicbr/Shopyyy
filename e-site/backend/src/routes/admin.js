const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ==================== WORKER MANAGEMENT ====================

// Get all workers (Admin)
router.get('/workers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.name, u.email, u.phone 
      FROM workers w 
      JOIN users u ON w.user_id = u.user_id 
      WHERE w.is_active = true 
      ORDER BY w.joining_date DESC
    `);
    res.json({ workers: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workers.' });
  }
});

// Add new worker (Admin)
router.post('/workers', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, email, phone, password, designation, department, base_salary, salary_type, joining_date, emergency_contact, address, id_proof_type, id_proof_number } = req.body;

    // Create user account for worker
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password || 'cbr@123', 12);

    const userResult = await client.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
      [name, email, passwordHash, phone, 'worker']
    );

    // Generate employee code
    const empCode = `CBR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // Create worker profile
    const workerResult = await client.query(
      `INSERT INTO workers (user_id, employee_code, designation, department, base_salary, salary_type, joining_date, emergency_contact, address, id_proof_type, id_proof_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [userResult.rows[0].user_id, empCode, designation, department, base_salary, salary_type || 'monthly', joining_date, emergency_contact, address, id_proof_type, id_proof_number]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Worker added successfully', worker: { ...workerResult.rows[0], name, email, phone } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add worker error:', error);
    res.status(500).json({ error: 'Failed to add worker.' });
  } finally {
    client.release();
  }
});

// Update worker (Admin)
router.put('/workers/:workerId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { designation, department, base_salary, salary_type, emergency_contact, address } = req.body;
    const result = await pool.query(
      `UPDATE workers SET 
        designation = COALESCE($1, designation), department = COALESCE($2, department),
        base_salary = COALESCE($3, base_salary), salary_type = COALESCE($4, salary_type),
        emergency_contact = COALESCE($5, emergency_contact), address = COALESCE($6, address)
       WHERE worker_id = $7 RETURNING *`,
      [designation, department, base_salary, salary_type, emergency_contact, address, req.params.workerId]
    );
    res.json({ worker: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update worker.' });
  }
});

// Deactivate worker (Admin)
router.delete('/workers/:workerId', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE workers SET is_active = false WHERE worker_id = $1', [req.params.workerId]);
    res.json({ message: 'Worker deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate worker.' });
  }
});

// ==================== ATTENDANCE ====================

// Mark attendance (Admin or Worker self)
router.post('/attendance', authenticate, authorize('admin', 'worker'), async (req, res) => {
  try {
    const { worker_id, date, check_in_time, check_out_time, status, leave_type, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO attendance (worker_id, date, check_in_time, check_out_time, status, leave_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (worker_id, date)
       DO UPDATE SET check_in_time = COALESCE($3, attendance.check_in_time), check_out_time = COALESCE($4, attendance.check_out_time), status = COALESCE($5, attendance.status), leave_type = $6, notes = $7
       RETURNING *`,
      [worker_id, date, check_in_time, check_out_time, status || 'present', leave_type, notes]
    );

    res.json({ attendance: result.rows[0] });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
});

// Get attendance for a worker (monthly)
router.get('/attendance/:workerId', authenticate, authorize('admin', 'worker'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await pool.query(
      `SELECT * FROM attendance 
       WHERE worker_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
       ORDER BY date`,
      [req.params.workerId, month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    // Summary
    const present = result.rows.filter(r => r.status === 'present').length;
    const absent = result.rows.filter(r => r.status === 'absent').length;
    const leaves = result.rows.filter(r => r.status === 'leave').length;
    const halfDays = result.rows.filter(r => r.status === 'half_day').length;

    res.json({
      attendance: result.rows,
      summary: { present, absent, leaves, halfDays, totalDays: result.rows.length }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

// ==================== SALARY / PAYROLL ====================

// Generate salary for a worker (Admin)
router.post('/salary/generate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { worker_id, month_year, overtime_hours, incentive, deductions } = req.body;

    // Get worker details
    const worker = await pool.query('SELECT * FROM workers WHERE worker_id = $1', [worker_id]);
    if (worker.rows.length === 0) return res.status(404).json({ error: 'Worker not found.' });

    const w = worker.rows[0];

    // Get attendance for the month
    const [month, year] = month_year.split('-').map(Number);
    const attendance = await pool.query(
      `SELECT * FROM attendance WHERE worker_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
      [worker_id, month, year]
    );

    const workingDays = attendance.rows.filter(a => a.status === 'present').length;
    const halfDays = attendance.rows.filter(a => a.status === 'half_day').length;
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const leavesTaken = attendance.rows.filter(a => a.status === 'leave' || a.status === 'absent').length;

    // Calculate salary
    let basePay;
    if (w.salary_type === 'monthly') {
      const perDayRate = w.base_salary / totalDaysInMonth;
      basePay = perDayRate * (workingDays + halfDays * 0.5);
    } else {
      basePay = w.base_salary * (workingDays + halfDays * 0.5);
    }

    const overtimeBonus = (overtime_hours || 0) * (w.base_salary / totalDaysInMonth / 8) * 1.5;
    const totalIncentive = incentive || 0;
    const totalDeductions = deductions || 0;
    const netSalary = basePay + overtimeBonus + totalIncentive - totalDeductions;

    const result = await pool.query(
      `INSERT INTO salaries (worker_id, month_year, working_days, total_days, leaves_taken, overtime_hours, overtime_bonus, incentive, deductions, net_salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [worker_id, month_year, workingDays, totalDaysInMonth, leavesTaken, overtime_hours || 0, overtimeBonus, totalIncentive, totalDeductions, netSalary]
    );

    res.json({ salary: result.rows[0] || { message: 'Salary already generated for this month.' } });
  } catch (error) {
    console.error('Salary generation error:', error);
    res.status(500).json({ error: 'Failed to generate salary.' });
  }
});

// Get salary history for a worker
router.get('/salary/:workerId', authenticate, authorize('admin', 'worker'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM salaries WHERE worker_id = $1 ORDER BY month_year DESC',
      [req.params.workerId]
    );
    res.json({ salaries: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salary history.' });
  }
});

// Mark salary as paid (Admin)
router.put('/salary/:salaryId/pay', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { payment_mode } = req.body;
    const result = await pool.query(
      `UPDATE salaries SET payment_status = 'paid', payment_date = NOW(), payment_mode = $1 WHERE salary_id = $2 RETURNING *`,
      [payment_mode, req.params.salaryId]
    );
    res.json({ salary: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment.' });
  }
});

// ==================== ADMIN DASHBOARD STATS ====================

router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Today's sales
    const todaySales = await pool.query(
      `SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as revenue 
       FROM orders WHERE DATE(order_date) = CURRENT_DATE AND payment_status = 'paid'`
    );

    // Monthly sales
    const monthlySales = await pool.query(
      `SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as revenue 
       FROM orders WHERE EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM NOW()) AND payment_status = 'paid'`
    );

    // Total products & low stock
    const productStats = await pool.query(
      `SELECT COUNT(DISTINCT p.product_id) as total_products,
        COUNT(CASE WHEN pv.stock_quantity <= pv.low_stock_threshold THEN 1 END) as low_stock_count
       FROM products p LEFT JOIN product_variants pv ON p.product_id = pv.product_id WHERE p.is_active = true`
    );

    // Active workers
    const workerCount = await pool.query('SELECT COUNT(*) FROM workers WHERE is_active = true');

    // Pending orders
    const pendingOrders = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE order_status IN ('placed', 'confirmed', 'processing')`
    );

    // Recent orders
    const recentOrders = await pool.query(
      `SELECT o.*, u.name as customer_name FROM orders o LEFT JOIN users u ON o.customer_id = u.user_id ORDER BY o.order_date DESC LIMIT 5`
    );

    res.json({
      today: todaySales.rows[0],
      monthly: monthlySales.rows[0],
      products: productStats.rows[0],
      workers: parseInt(workerCount.rows[0].count),
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

// ==================== SALES ANALYTICS ====================

router.get('/analytics/sales', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    // Monthly sales for the year
    const monthlySales = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM order_date) as month,
        COUNT(*) as orders,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE EXTRACT(YEAR FROM order_date) = $1 AND payment_status = 'paid'
      GROUP BY EXTRACT(MONTH FROM order_date)
      ORDER BY month
    `, [year]);

    // Category-wise sales
    const categorySales = await pool.query(`
      SELECT p.category, p.department,
        COUNT(oi.order_item_id) as items_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE EXTRACT(YEAR FROM o.order_date) = $1 AND o.payment_status = 'paid'
      GROUP BY p.category, p.department
      ORDER BY revenue DESC
    `, [year]);

    // Year-over-year comparison
    const prevYear = parseInt(year) - 1;
    const yoyComparison = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM order_date) as year,
        EXTRACT(MONTH FROM order_date) as month,
        COUNT(*) as orders,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE EXTRACT(YEAR FROM order_date) IN ($1, $2) AND payment_status = 'paid'
      GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
      ORDER BY year, month
    `, [year, prevYear]);

    res.json({
      monthlySales: monthlySales.rows,
      categorySales: categorySales.rows,
      yoyComparison: yoyComparison.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ==================== ORDER MANAGEMENT (Admin) ====================

router.get('/orders', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = `SELECT o.*, u.name as customer_name, u.phone as customer_phone FROM orders o LEFT JOIN users u ON o.customer_id = u.user_id`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` WHERE o.order_status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY o.order_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Update order status (Admin)
router.put('/orders/:orderId/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE orders SET order_status = $1, delivered_date = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_date END WHERE order_id = $2 RETURNING *`,
      [status, req.params.orderId]
    );
    res.json({ order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
