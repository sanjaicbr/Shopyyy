const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all products (public - with filters)
router.get('/', async (req, res) => {
  try {
    const {
      department, category, brand, seasonal_tag,
      min_price, max_price, size, color,
      is_new_collection, search, sort_by, order,
      page = 1, limit = 12
    } = req.query;

    let query = `
      SELECT p.*, 
        json_agg(json_build_object(
          'variant_id', pv.variant_id,
          'size', pv.size,
          'color', pv.color,
          'color_hex', pv.color_hex,
          'selling_price', pv.selling_price,
          'mrp', pv.mrp,
          'stock_quantity', pv.stock_quantity
        )) as variants,
        MIN(pv.selling_price) as min_price,
        MAX(pv.selling_price) as max_price
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id AND pv.is_active = true
      WHERE p.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (department) {
      query += ` AND p.department = $${paramIndex++}`;
      params.push(department);
    }
    if (category) {
      query += ` AND p.category = $${paramIndex++}`;
      params.push(category);
    }
    if (brand) {
      query += ` AND p.brand ILIKE $${paramIndex++}`;
      params.push(`%${brand}%`);
    }
    if (seasonal_tag) {
      query += ` AND p.seasonal_tag = $${paramIndex++}`;
      params.push(seasonal_tag);
    }
    if (is_new_collection === 'true') {
      query += ` AND p.is_new_collection = true`;
    }
    if (search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex} OR p.category ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (min_price) {
      query += ` AND pv.selling_price >= $${paramIndex++}`;
      params.push(min_price);
    }
    if (max_price) {
      query += ` AND pv.selling_price <= $${paramIndex++}`;
      params.push(max_price);
    }
    if (size) {
      query += ` AND pv.size = $${paramIndex++}`;
      params.push(size);
    }
    if (color) {
      query += ` AND pv.color ILIKE $${paramIndex++}`;
      params.push(`%${color}%`);
    }

    query += ` GROUP BY p.product_id`;

    // Sorting
    const sortOptions = {
      'price_low': 'MIN(pv.selling_price) ASC',
      'price_high': 'MAX(pv.selling_price) DESC',
      'newest': 'p.created_at DESC',
      'name': 'p.title ASC',
    };
    query += ` ORDER BY ${sortOptions[sort_by] || 'p.created_at DESC'}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE is_active = true'
    );

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT * FROM products WHERE product_id = $1 AND is_active = true', [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const variants = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY size',
      [id]
    );

    res.json({ product: { ...product.rows[0], variants: variants.rows } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// Create product (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      title, description, brand, department, category, sub_category,
      fabric_material, seasonal_tag, is_new_collection, is_featured, images, variants
    } = req.body;

    const productResult = await pool.query(
      `INSERT INTO products (title, description, brand, department, category, sub_category, fabric_material, seasonal_tag, is_new_collection, is_featured, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [title, description, brand, department, category, sub_category, fabric_material, seasonal_tag, is_new_collection || false, is_featured || false, images || []]
    );

    const product = productResult.rows[0];

    // Insert variants
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await pool.query(
          `INSERT INTO product_variants (product_id, size, color, color_hex, cost_price, selling_price, mrp, stock_quantity, low_stock_threshold, sku_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [product.product_id, variant.size, variant.color, variant.color_hex, variant.cost_price, variant.selling_price, variant.mrp, variant.stock_quantity || 0, variant.low_stock_threshold || 5, variant.sku_code]
        );
      }
    }

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, brand, department, category, sub_category, fabric_material, seasonal_tag, is_new_collection, is_featured, images } = req.body;

    const result = await pool.query(
      `UPDATE products SET 
        title = COALESCE($1, title), description = COALESCE($2, description),
        brand = COALESCE($3, brand), department = COALESCE($4, department),
        category = COALESCE($5, category), sub_category = COALESCE($6, sub_category),
        fabric_material = COALESCE($7, fabric_material), seasonal_tag = COALESCE($8, seasonal_tag),
        is_new_collection = COALESCE($9, is_new_collection), is_featured = COALESCE($10, is_featured),
        images = COALESCE($11, images), updated_at = NOW()
       WHERE product_id = $12 RETURNING *`,
      [title, description, brand, department, category, sub_category, fabric_material, seasonal_tag, is_new_collection, is_featured, images, id]
    );

    res.json({ product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Delete product (soft delete - Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = false WHERE product_id = $1', [req.params.id]);
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Get categories list (public)
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category, department FROM products WHERE is_active = true ORDER BY department, category'
    );
    res.json({ categories: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Get brands list (public)
router.get('/meta/brands', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT brand FROM products WHERE is_active = true AND brand IS NOT NULL ORDER BY brand'
    );
    res.json({ brands: result.rows.map(r => r.brand) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
});

module.exports = router;
