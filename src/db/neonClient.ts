import { neon } from '@neondatabase/serverless';

const NEON_DB_URL =
  (import.meta as any).env?.VITE_NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_5COLn9shEHdi@ep-sweet-salad-b5twl33x-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(NEON_DB_URL);

/**
 * Ensures Neon PostgreSQL Database tables exist
 */
export async function initNeonTables() {
  try {
    // 1. Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(20) NOT NULL,
        phone VARCHAR(20),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Business Profile Table
    await sql`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        tagline VARCHAR(255),
        logo TEXT,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        phone VARCHAR(30),
        email VARCHAR(100),
        website VARCHAR(150),
        gstin VARCHAR(30),
        pan VARCHAR(30),
        currency VARCHAR(10) DEFAULT 'INR',
        currency_symbol VARCHAR(5) DEFAULT '₹',
        invoice_prefix VARCHAR(20) DEFAULT 'INV-2026-',
        bank_details JSONB,
        terms_and_conditions TEXT,
        tax_registration_type VARCHAR(30) DEFAULT 'Regular'
      );
    `;

    // 3. Customers Table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        customer_code VARCHAR(50),
        phone VARCHAR(30),
        email VARCHAR(100),
        gstin VARCHAR(30),
        billing_address TEXT,
        shipping_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        total_purchases NUMERIC(12,2) DEFAULT 0,
        total_paid NUMERIC(12,2) DEFAULT 0,
        outstanding_balance NUMERIC(12,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Categories Table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      );
    `;

    // 5. Products Table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        barcode VARCHAR(100),
        hsn_sac VARCHAR(30),
        category VARCHAR(100),
        purchase_price NUMERIC(12,2) DEFAULT 0,
        selling_price NUMERIC(12,2) DEFAULT 0,
        gst_rate NUMERIC(5,2) DEFAULT 18,
        current_stock NUMERIC(10,2) DEFAULT 0,
        min_stock_level NUMERIC(10,2) DEFAULT 5,
        unit VARCHAR(20) DEFAULT 'pcs',
        image_url TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Invoices Table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date VARCHAR(20),
        due_date VARCHAR(20),
        customer_id VARCHAR(50),
        customer_name VARCHAR(150),
        customer_phone VARCHAR(30),
        customer_email VARCHAR(100),
        customer_gstin VARCHAR(30),
        billing_address TEXT,
        shipping_address TEXT,
        place_of_supply_state VARCHAR(100),
        business_state VARCHAR(100),
        is_inter_state BOOLEAN DEFAULT FALSE,
        reverse_charge BOOLEAN DEFAULT FALSE,
        items JSONB NOT NULL,
        subtotal NUMERIC(12,2) DEFAULT 0,
        total_discount NUMERIC(12,2) DEFAULT 0,
        taxable_subtotal NUMERIC(12,2) DEFAULT 0,
        total_cgst NUMERIC(12,2) DEFAULT 0,
        total_sgst NUMERIC(12,2) DEFAULT 0,
        total_igst NUMERIC(12,2) DEFAULT 0,
        total_tax NUMERIC(12,2) DEFAULT 0,
        shipping_charges NUMERIC(12,2) DEFAULT 0,
        additional_charges NUMERIC(12,2) DEFAULT 0,
        round_off NUMERIC(6,2) DEFAULT 0,
        grand_total NUMERIC(12,2) DEFAULT 0,
        amount_paid NUMERIC(12,2) DEFAULT 0,
        balance_due NUMERIC(12,2) DEFAULT 0,
        payment_status VARCHAR(30) DEFAULT 'Pending',
        invoice_type VARCHAR(30) DEFAULT 'Regular',
        notes TEXT,
        created_by_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 7. Payments Table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        payment_number VARCHAR(50) NOT NULL,
        invoice_id VARCHAR(50),
        invoice_number VARCHAR(50),
        customer_id VARCHAR(50),
        customer_name VARCHAR(150),
        amount NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_date VARCHAR(20),
        transaction_reference TEXT,
        notes TEXT,
        created_by_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 8. Expenses Table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        expense_number VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        amount NUMERIC(12,2) DEFAULT 0,
        tax_amount NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(50),
        date VARCHAR(20),
        supplier_name VARCHAR(150),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 9. Audit Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(100),
        action TEXT NOT NULL,
        module VARCHAR(50),
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 10. Notifications Table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('✅ Neon PostgreSQL Cloud Tables Initialized Successfully!');
  } catch (err) {
    console.error('⚠️ Neon Database Table Initialization Warning:', err);
  }
}
