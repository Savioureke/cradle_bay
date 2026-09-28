import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSchool } from '../../context/SchoolContext';
import { 
  CreditCard, Receipt, CheckCircle, Clock, 
  Download, Printer, AlertCircle, RefreshCw 
} from 'lucide-react';
import PaystackCheckoutModal from '../../components/PaystackCheckoutModal';
import ReceiptModal from '../../components/ReceiptModal';

const StudentFees = () => {
  const { user, activeWard, isParent } = useAuth();
  const { school, activeSession, activeTerm, showToast } = useSchool();
  const [invoice, setInvoice] = useState(null);
  const [feeItems, setFeeItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const studentName = isParent ? activeWard?.name : user?.full_name;
  const admissionNumber = isParent ? activeWard?.admission_number : user?.admission_number;
  const studentId = isParent ? activeWard?.id : (user?.student_id || user?.id);

  const fetchStudentFinancials = async () => {
    setLoading(true);
    try {
      // 1. Fetch current term invoice for student
      const { data: invData } = await supabase
        .from('invoices')
        .select(`
          *,
          students (first_name, last_name, admission_number, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setInvoice(invData);

      // 2. Fetch fee breakdown structures
      const { data: strData } = await supabase
        .from('fee_structures')
        .select('*');

      setFeeItems(strData || []);

      // 3. Fetch past payments
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      setPayments(payData || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFinancials();
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-navy">School Fees & Online Payment</h1>
          <p className="text-xs text-slate-500">
            Official fees breakdown, Paystack inline payment, installment balances, and PDF receipts
          </p>
        </div>

        {invoice && Number(invoice.balance) > 0 && (
          <button
            onClick={() => setIsPaystackOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all w-fit"
          >
            <CreditCard size={16} />
            <span>Pay with Paystack (₦{Number(invoice.balance).toLocaleString()} Due)</span>
          </button>
        )}
      </div>

      {/* Invoice Overview Card */}
      {invoice ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <div className="bg-brand-navy p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Official Term Fee Invoice
              </span>
              <h2 className="text-xl font-black mt-0.5">{invoice.invoice_number}</h2>
              <p className="text-xs text-slate-300 mt-1">
                Pupil: <strong>{studentName}</strong> ({admissionNumber}) • {activeSession.name} {activeTerm.name}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-300 block">Outstanding Balance</span>
              <div className="text-2xl font-black text-amber-400">
                ₦{Number(invoice.balance).toLocaleString()}
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                invoice.status === 'paid' ? 'bg-emerald-500 text-white' :
                invoice.status === 'partially_paid' ? 'bg-amber-400 text-brand-navy' : 'bg-red-500 text-white'
              }`}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Fee Itemization */}
          <div className="p-6">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">
              Itemized Fee Schedule
            </h3>
            <div className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl overflow-hidden mb-6">
              {feeItems.map(item => (
                <div key={item.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-slate-400 text-[11px]">Due Date: {item.due_date || 'Term Onset'}</div>
                  </div>
                  <div className="font-black text-slate-800 text-sm">
                    ₦{Number(item.amount).toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="p-3.5 bg-slate-50 font-bold flex justify-between text-sm">
                <span>Total Term Fees</span>
                <span className="text-brand-navy font-black">₦{Number(invoice.total_amount).toLocaleString()}</span>
              </div>
              <div className="p-3.5 bg-emerald-50/50 font-bold flex justify-between text-sm text-emerald-800">
                <span>Total Amount Paid</span>
                <span className="font-black">₦{Number(invoice.paid_amount).toLocaleString()}</span>
              </div>
              <div className="p-3.5 bg-amber-50/50 font-bold flex justify-between text-sm text-amber-800">
                <span>Running Balance Remaining</span>
                <span className="font-black">₦{Number(invoice.balance).toLocaleString()}</span>
              </div>
            </div>

            {/* Action footer */}
            {Number(invoice.balance) > 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-900">Make an Online Payment</div>
                  <p className="text-emerald-700">
                    Pay in full or partial installments securely via Debit Card, Bank Transfer, or USSD.
                  </p>
                </div>
                <button
                  onClick={() => setIsPaystackOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all whitespace-nowrap"
                >
                  Pay with Paystack
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center space-x-2 text-xs text-emerald-900 font-bold">
                <CheckCircle size={18} className="text-emerald-700" />
                <span>All fees for this academic term have been fully cleared! Official receipts available below.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border">
          <Receipt size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">No invoice records found for student.</p>
        </div>
      )}

      {/* Payment History & Receipts */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Official Payment History & Downloadable Receipts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Amount Paid</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-brand-blue">{p.payment_reference}</td>
                  <td className="py-3 px-3 font-black text-slate-900">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="py-3 px-3 uppercase text-slate-600">{p.channel}</td>
                  <td className="py-3 px-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedReceipt({
                        receipt_number: `REC-${p.payment_reference.slice(0, 12)}`,
                        student_name: studentName,
                        admission_number: admissionNumber,
                        amount_paid: p.amount,
                        balance_remaining: invoice?.balance || 0,
                        payment_method: 'Paystack Online Gateway',
                        payment_reference: p.payment_reference
                      })}
                      className="px-3 py-1 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg text-xs font-bold"
                    >
                      Print Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paystack Modal */}
      {isPaystackOpen && invoice && (
        <PaystackCheckoutModal
          invoice={invoice}
          student={{
            id: studentId,
            full_name: studentName,
            admission_number: admissionNumber
          }}
          onSuccess={(receipt) => {
            setIsPaystackOpen(false);
            fetchStudentFinancials();
            setSelectedReceipt(receipt);
            showToast('Payment verified successfully via Paystack!');
          }}
          onClose={() => setIsPaystackOpen(false)}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default StudentFees;
