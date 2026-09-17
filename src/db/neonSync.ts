import { sql } from './neonClient';
import { Invoice, Product, Customer, Payment, Expense } from '../types';

export async function syncInvoiceToNeon(invoice: Invoice) {
  try {
    await sql`
      INSERT INTO invoices (
        id, invoice_number, invoice_date, due_date, customer_id, customer_name,
        customer_phone, customer_email, customer_gstin, billing_address, shipping_address,
        place_of_supply_state, business_state, is_inter_state, reverse_charge, items,
        subtotal, total_discount, taxable_subtotal, total_cgst, total_sgst, total_igst,
        total_tax, shipping_charges, additional_charges, round_off, grand_total,
        amount_paid, balance_due, payment_status, invoice_type, notes, created_by_id
      ) VALUES (
        ${invoice.id}, ${invoice.invoiceNumber}, ${invoice.invoiceDate}, ${invoice.dueDate},
        ${invoice.customerId}, ${invoice.customerName}, ${invoice.customerPhone}, ${invoice.customerEmail},
        ${invoice.customerGstin || ''}, ${invoice.billingAddress}, ${invoice.shippingAddress},
        ${invoice.placeOfSupplyState}, ${invoice.businessState}, ${invoice.isInterState},
        ${invoice.reverseCharge}, ${JSON.stringify(invoice.items)}, ${invoice.subtotal},
        ${invoice.totalDiscount}, ${invoice.taxableSubtotal}, ${invoice.totalCgst},
        ${invoice.totalSgst}, ${invoice.totalIgst}, ${invoice.totalTax}, ${invoice.shippingCharges},
        ${invoice.additionalCharges}, ${invoice.roundOff}, ${invoice.grandTotal}, ${invoice.amountPaid},
        ${invoice.balanceDue}, ${invoice.paymentStatus}, ${invoice.invoiceType}, ${invoice.notes || ''},
        ${invoice.createdById}
      )
      ON CONFLICT (id) DO UPDATE SET
        amount_paid = EXCLUDED.amount_paid,
        balance_due = EXCLUDED.balance_due,
        payment_status = EXCLUDED.payment_status;
    `;
    console.log(`Synced Invoice ${invoice.invoiceNumber} to Neon DB`);
  } catch (err) {
    console.error('Error syncing invoice to Neon DB:', err);
  }
}

export async function syncProductToNeon(product: Product) {
  try {
    await sql`
      INSERT INTO products (
        id, name, sku, barcode, hsn_sac, category, purchase_price, selling_price,
        gst_rate, current_stock, min_stock_level, unit
      ) VALUES (
        ${product.id}, ${product.name}, ${product.sku}, ${product.barcode}, ${product.hsnSac},
        ${product.category}, ${product.purchasePrice}, ${product.sellingPrice}, ${product.gstRate},
        ${product.currentStock}, ${product.minStockLevel}, ${product.unit}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        current_stock = EXCLUDED.current_stock,
        selling_price = EXCLUDED.selling_price;
    `;
    console.log(`Synced Product ${product.name} to Neon DB`);
  } catch (err) {
    console.error('Error syncing product to Neon DB:', err);
  }
}

export async function syncCustomerToNeon(customer: Customer) {
  try {
    await sql`
      INSERT INTO customers (
        id, name, customer_code, phone, email, gstin, billing_address, shipping_address,
        state, total_purchases, total_paid, outstanding_balance
      ) VALUES (
        ${customer.id}, ${customer.name}, ${customer.customerCode}, ${customer.phone},
        ${customer.email}, ${customer.gstin || ''}, ${customer.billingAddress},
        ${customer.shippingAddress}, ${customer.state}, ${customer.totalPurchases},
        ${customer.totalPaid}, ${customer.outstandingBalance}
      )
      ON CONFLICT (id) DO UPDATE SET
        total_purchases = EXCLUDED.total_purchases,
        total_paid = EXCLUDED.total_paid,
        outstanding_balance = EXCLUDED.outstanding_balance;
    `;
    console.log(`Synced Customer ${customer.name} to Neon DB`);
  } catch (err) {
    console.error('Error syncing customer to Neon DB:', err);
  }
}

export async function syncPaymentToNeon(payment: Payment) {
  try {
    await sql`
      INSERT INTO payments (
        id, payment_number, invoice_id, invoice_number, customer_id, customer_name,
        amount, payment_method, payment_date, transaction_reference, notes, created_by_id
      ) VALUES (
        ${payment.id}, ${payment.paymentNumber}, ${payment.invoiceId}, ${payment.invoiceNumber},
        ${payment.customerId}, ${payment.customerName}, ${payment.amount}, ${payment.paymentMethod},
        ${payment.paymentDate}, ${payment.transactionReference || ''}, ${payment.notes || ''}, ${payment.createdById}
      );
    `;
    console.log(`Synced Payment ${payment.paymentNumber} to Neon DB`);
  } catch (err) {
    console.error('Error syncing payment to Neon DB:', err);
  }
}
