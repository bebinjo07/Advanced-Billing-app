import React from 'react';
import { Invoice, BusinessProfile } from '../../types';
import { formatCurrency, numberToWordsIndian } from '../../utils/numberToWords';
import { Printer, Download, Share2, Mail, X } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useNotifications } from '../../context/NotificationContext';

interface InvoicePrintViewProps {
  invoice: Invoice;
  business: BusinessProfile;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  business,
  onClose,
}) => {
  const { showToast } = useNotifications();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = await generateInvoicePDF(invoice, business);
      doc.save(`${invoice.invoiceNumber}.pdf`);
      showToast(`Invoice ${invoice.invoiceNumber} downloaded as PDF`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Tax Invoice ${invoice.invoiceNumber} from ${business.name} for ${formatCurrency(invoice.grandTotal)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Invoice link copied to clipboard!', 'info');
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${business.name}`);
    const body = encodeURIComponent(
      `Dear ${invoice.customerName},\n\nPlease find attached details for your Invoice #${invoice.invoiceNumber}.\nGrand Total: ₹${invoice.grandTotal}\nDue Date: ${invoice.dueDate}\n\nThank you for doing business with us!\n${business.name}`
    );
    window.open(`mailto:${invoice.customerEmail}?subject=${subject}&body=${body}`);
    showToast(`Email client opened for ${invoice.customerEmail}`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-800 text-white border-b border-slate-700">
          <div className="font-bold text-base flex items-center space-x-2">
            <span>Invoice Preview — {invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="printable-area p-8 bg-white text-slate-900 text-xs space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-600">{business.name}</h1>
              {business.tagline && <p className="text-slate-500 font-medium">{business.tagline}</p>}
              <p className="mt-2 text-slate-600">
                {business.address}, {business.city}, {business.state} - {business.pincode}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">GSTIN:</span> {business.gstin} |{' '}
                <span className="font-semibold">Phone:</span> {business.phone}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Email:</span> {business.email}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block text-lg font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1 rounded">
                TAX INVOICE
              </span>
              <div className="mt-2 text-sm font-bold text-slate-800">
                # {invoice.invoiceNumber}
              </div>
              <div className="text-slate-500 text-[11px] mt-1">
                <div><span className="font-semibold">Invoice Date:</span> {invoice.invoiceDate}</div>
                <div><span className="font-semibold">Due Date:</span> {invoice.dueDate}</div>
                <div className="mt-1 font-bold text-emerald-700 uppercase">
                  Status: {invoice.paymentStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Supply Details Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Billed To:
              </h4>
              <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
              <div className="text-slate-600 leading-relaxed mt-0.5">{invoice.billingAddress}</div>
              <div className="text-slate-600 mt-1">
                <span className="font-semibold">Phone:</span> {invoice.customerPhone}
              </div>
              <div className="text-slate-600">
                <span className="font-semibold">Email:</span> {invoice.customerEmail}
              </div>
              <div className="text-slate-700 font-semibold mt-1">
                GSTIN: {invoice.customerGstin || 'Unregistered'}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Tax & Supply Info:
              </h4>
              <div className="space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold">Place of Supply:</span> {invoice.placeOfSupplyState}
                </div>
                <div>
                  <span className="font-semibold">Supply Type:</span>{' '}
                  {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </div>
                <div>
                  <span className="font-semibold">Reverse Charge:</span>{' '}
                  {invoice.reverseCharge ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-semibold">Business State:</span> {invoice.businessState}
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Product Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
              <thead>
                <tr className="bg-emerald-600 text-white text-[11px] font-bold">
                  <th className="p-2 border border-slate-300 text-center">#</th>
                  <th className="p-2 border border-slate-300 text-left">Item Description</th>
                  <th className="p-2 border border-slate-300 text-center">HSN/SAC</th>
                  <th className="p-2 border border-slate-300 text-center">Qty</th>
                  <th className="p-2 border border-slate-300 text-right">Unit Price</th>
                  <th className="p-2 border border-slate-300 text-right">Disc</th>
                  <th className="p-2 border border-slate-300 text-right">Taxable</th>
                  {invoice.isInterState ? (
                    <th className="p-2 border border-slate-300 text-center">IGST</th>
                  ) : (
                    <>
                      <th className="p-2 border border-slate-300 text-center">CGST</th>
                      <th className="p-2 border border-slate-300 text-center">SGST</th>
                    </>
                  )}
                  <th className="p-2 border border-slate-300 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-200 text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{item.productName}</td>
                    <td className="p-2 border border-slate-200 text-center font-mono">{item.hsnSac || '-'}</td>
                    <td className="p-2 border border-slate-200 text-center font-bold">{item.quantity}</td>
                    <td className="p-2 border border-slate-200 text-right">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="p-2 border border-slate-200 text-right text-rose-600">
                      {item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-medium">
                      ₹{item.taxableAmount.toFixed(2)}
                    </td>
                    {invoice.isInterState ? (
                      <td className="p-2 border border-slate-200 text-center">
                        {item.igstRate}% <br />
                        <span className="text-[10px] text-slate-500">(₹{item.igstAmount.toFixed(2)})</span>
                      </td>
                    ) : (
                      <>
                        <td className="p-2 border border-slate-200 text-center">
                          {item.cgstRate}% <br />
                          <span className="text-[10px] text-slate-500">(₹{item.cgstAmount.toFixed(2)})</span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          {item.sgstRate}% <br />
                          <span className="text-[10px] text-slate-500">(₹{item.sgstAmount.toFixed(2)})</span>
                        </td>
                      </>
                    )}
                    <td className="p-2 border border-slate-200 text-right font-bold">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount in Words & Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Amount in Words & Bank Details */}
            <div className="space-y-4">
              <div>
                <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">
                  Amount in Words:
                </span>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 font-semibold text-slate-700 italic">
                  {numberToWordsIndian(invoice.grandTotal)}
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] uppercase block">
                  Bank Payment Information:
                </span>
                <div className="text-slate-600">
                  <span className="font-semibold">Bank Name:</span> {business.bankDetails.bankName}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold">Account No:</span> {business.bankDetails.accountNumber}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold">IFSC Code:</span> {business.bankDetails.ifscCode}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold">UPI ID:</span> {business.bankDetails.upiId}
                </div>
              </div>
            </div>

            {/* Right: Calculations Summary */}
            <div className="space-y-1.5 text-right font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Discount:</span>
                <span>-₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                <span>Taxable Amount:</span>
                <span className="font-semibold">₹{invoice.taxableSubtotal.toFixed(2)}</span>
              </div>
              {invoice.isInterState ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST Total:</span>
                  <span>₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST Total:</span>
                    <span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST Total:</span>
                    <span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {invoice.shippingCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Charges:</span>
                  <span>₹{invoice.shippingCharges.toFixed(2)}</span>
                </div>
              )}
              {invoice.additionalCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Additional Charges:</span>
                  <span>₹{invoice.additionalCharges.toFixed(2)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off:</span>
                  <span>
                    {invoice.roundOff > 0 ? '+' : ''}₹{invoice.roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total Highlight Box */}
              <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-extrabold text-base my-2">
                <span>Grand Total:</span>
                <span>₹{invoice.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 text-xs">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600">₹{invoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-800 text-xs font-bold pt-1 border-t border-slate-200">
                <span>Balance Due:</span>
                <span className="text-rose-600">₹{invoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
            <div>
              <div className="font-bold text-slate-800 uppercase text-[10px] mb-1">
                Terms & Conditions:
              </div>
              <p className="text-slate-500 whitespace-pre-line text-[10px] max-w-md">
                {business.termsAndConditions}
              </p>
            </div>

            <div className="text-right">
              <div className="h-10"></div>
              <div className="font-bold text-slate-800 text-xs">For {business.name}</div>
              <div className="text-slate-500 text-[10px] border-t border-slate-300 pt-1 mt-1">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
