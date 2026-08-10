require('dotenv').config();
const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table (Admin, Worker, Customer)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'worker', 'customer')),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Owner / Shop Details
    await client.query(`
      CREATE TABLE IF NOT EXISTS owner_details (
        owner_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        shop_name VARCHAR(200) NOT NULL DEFAULT 'CBR Collections',
        gst_number VARCHAR(20),
        registration_number VARCHAR(50),
        contact_number VARCHAR(15),
        email VARCHAR(150),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        business_hours VARCHAR(100),
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Workers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        worker_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        employee_code VARCHAR(20) UNIQUE,
        designation VARCHAR(100),
        department VARCHAR(100),
        base_salary DECIMAL(10, 2) DEFAULT 0,
        salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'daily')),
        joining_date DATE,
        emergency_contact VARCHAR(15),
        address TEXT,
        id_proof_type VARCHAR(50),
        id_proof_number VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        attendance_id SERIAL PRIMARY KEY,
        worker_id INTEGER REFERENCES workers(worker_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in_time TIME,
        check_out_time TIME,
        status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
        leave_type VARCHAR(30),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(worker_id, date)
      );
    `);

    // Salaries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS salaries (
        salary_id SERIAL PRIMARY KEY,
        worker_id INTEGER REFERENCES workers(worker_id) ON DELETE CASCADE,
        month_year VARCHAR(7) NOT NULL,
        working_days INTEGER DEFAULT 0,
        total_days INTEGER DEFAULT 0,
        leaves_taken INTEGER DEFAULT 0,
        overtime_hours DECIMAL(5, 2) DEFAULT 0,
        overtime_bonus DECIMAL(10, 2) DEFAULT 0,
        incentive DECIMAL(10, 2) DEFAULT 0,
        deductions DECIMAL(10, 2) DEFAULT 0,
        net_salary DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
        payment_date DATE,
        payment_mode VARCHAR(30),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        supplier_id SERIAL PRIMARY KEY,
        company_name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(15),
        email VARCHAR(150),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        supply_categories TEXT[],
        gst_number VARCHAR(20),
        credit_period_days INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        brand VARCHAR(100),
        department VARCHAR(50) CHECK (department IN ('men', 'women', 'kids', 'unisex')),
        category VARCHAR(100),
        sub_category VARCHAR(100),
        fabric_material VARCHAR(100),
        seasonal_tag VARCHAR(50),
        is_new_collection BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        images TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Product Variants (size, color, price, stock)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        variant_id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
        size VARCHAR(10),
        color VARCHAR(50),
        color_hex VARCHAR(7),
        cost_price DECIMAL(10, 2) NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        mrp DECIMAL(10, 2),
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        sku_code VARCHAR(50) UNIQUE,
        barcode VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Discounts / Offers
    await client.query(`
      CREATE TABLE IF NOT EXISTS discounts (
        discount_id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'flat', 'bogo')),
        discount_percent DECIMAL(5, 2),
        flat_amount DECIMAL(10, 2),
        min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(30) UNIQUE,
        applicable_departments TEXT[],
        applicable_categories TEXT[],
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Customer addresses
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        address_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        label VARCHAR(50) DEFAULT 'Home',
        full_name VARCHAR(100),
        phone VARCHAR(15),
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Shopping Cart
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        cart_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(variant_id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, variant_id)
      );
    `);

    // Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        order_number VARCHAR(30) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES users(user_id),
        processed_by_worker_id INTEGER REFERENCES workers(worker_id),
        order_type VARCHAR(20) DEFAULT 'online' CHECK (order_type IN ('online', 'in_store')),
        subtotal DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_amount DECIMAL(10, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        payment_mode VARCHAR(30),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_id VARCHAR(100),
        order_status VARCHAR(30) DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
        shipping_address_id INTEGER REFERENCES customer_addresses(address_id),
        notes TEXT,
        order_date TIMESTAMP DEFAULT NOW(),
        delivered_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Order Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(variant_id),
        product_title VARCHAR(200),
        size VARCHAR(10),
        color VARCHAR(50),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Purchase Orders (to suppliers)
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        po_id SERIAL PRIMARY KEY,
        po_number VARCHAR(30) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(supplier_id),
        total_amount DECIMAL(12, 2),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'partial', 'cancelled')),
        expected_delivery DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        po_item_id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id),
        variant_id INTEGER REFERENCES product_variants(variant_id),
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10, 2),
        total_cost DECIMAL(10, 2),
        received_quantity INTEGER DEFAULT 0
      );
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
