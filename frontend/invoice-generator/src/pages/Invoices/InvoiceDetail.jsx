import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Loader2, Edit, Printer, AlertCircle, Mail, Download, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import Button from '../../components/ui/Button';
import ReminderModal from '../../components/ReminderModal';

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #333',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceInfo: {
    fontSize: 11,
    marginBottom: 5,
  },
  statusBadge: {
    fontSize: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
    textTransform: 'uppercase',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 11,
    marginBottom: 3,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #333',
    paddingBottom: 8,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 10,
  },
  tableCol1: { width: '45%' },
  tableCol2: { width: '15%', textAlign: 'right' },
  tableCol3: { width: '20%', textAlign: 'right' },
  tableCol4: { width: '20%', textAlign: 'right' },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 11,
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '1 solid #ddd',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTop: '2 solid #333',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 11,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 30,
    borderTop: '1 solid #ddd',
    paddingTop: 20,
  },
});

// PDF Document Component
const InvoicePDF = ({ invoice, formatCurrency, getInvoiceAmount }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>INVOICE</Text>
        <Text style={pdfStyles.invoiceInfo}>
          Invoice Number: {invoice.invoiceNumber || 'N/A'}
        </Text>
        <Text style={pdfStyles.invoiceInfo}>
          Date: {moment(invoice.invoiceDate).format('MMM DD, YYYY')}
        </Text>
        {invoice.dueDate && (
          <Text style={pdfStyles.invoiceInfo}>
            Due Date: {moment(invoice.dueDate).format('MMM DD, YYYY')}
          </Text>
        )}
        <View style={pdfStyles.statusBadge}>
          <Text>Status: {invoice.status || 'Unpaid'}</Text>
        </View>
      </View>

      {/* Bill From and Bill To */}
      <View style={{ flexDirection: 'row', marginBottom: 30 }}>
        {invoice.billFrom && (
          <View style={{ width: '50%' }}>
            <Text style={pdfStyles.sectionTitle}>Bill From</Text>
            <Text style={pdfStyles.companyName}>
              {invoice.billFrom.businessName || invoice.billFrom.companyName || 'N/A'}
            </Text>
            {invoice.billFrom.address && (
              <Text style={pdfStyles.text}>{String(invoice.billFrom.address)}</Text>
            )}
            {invoice.billFrom.email && (
              <Text style={pdfStyles.text}>{String(invoice.billFrom.email)}</Text>
            )}
            {invoice.billFrom.phone && (
              <Text style={pdfStyles.text}>{String(invoice.billFrom.phone)}</Text>
            )}
          </View>
        )}
        {invoice.billTo && (
          <View style={{ width: '50%' }}>
            <Text style={pdfStyles.sectionTitle}>Bill To</Text>
            <Text style={pdfStyles.companyName}>
              {invoice.billTo.clientName || 'N/A'}
            </Text>
            {invoice.billTo.address && (
              <Text style={pdfStyles.text}>{String(invoice.billTo.address)}</Text>
            )}
            {invoice.billTo.email && (
              <Text style={pdfStyles.text}>{String(invoice.billTo.email)}</Text>
            )}
            {invoice.billTo.phone && (
              <Text style={pdfStyles.text}>{String(invoice.billTo.phone)}</Text>
            )}
          </View>
        )}
      </View>

      {/* Items Table */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableCol1, pdfStyles.tableHeaderText]}>Description</Text>
          <Text style={[pdfStyles.tableCol2, pdfStyles.tableHeaderText]}>Quantity</Text>
          <Text style={[pdfStyles.tableCol3, pdfStyles.tableHeaderText]}>Unit Price</Text>
          <Text style={[pdfStyles.tableCol4, pdfStyles.tableHeaderText]}>Total</Text>
        </View>
        {invoice.items && invoice.items.length > 0 && invoice.items.map((item, index) => (
          <View key={index} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCol1, pdfStyles.tableCellText]}>
              {item.description || item.name || 'N/A'}
            </Text>
            <Text style={[pdfStyles.tableCol2, pdfStyles.tableCellText]}>
              {item.quantity !== undefined ? String(item.quantity) : '0'}
            </Text>
            <Text style={[pdfStyles.tableCol3, pdfStyles.tableCellText]}>
              {formatCurrency(Number(item.unitPrice || item.price || 0))}
            </Text>
            <Text style={[pdfStyles.tableCol4, pdfStyles.tableCellText]}>
              {formatCurrency(Number(item.total || 0))}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={pdfStyles.totalsSection}>
        {(invoice.subtotal !== undefined && invoice.subtotal !== null) && (
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Subtotal:</Text>
            <Text style={pdfStyles.totalLabel}>{formatCurrency(Number(invoice.subtotal))}</Text>
          </View>
        )}
        {((invoice.tax !== undefined && invoice.tax !== null) || (invoice.taxTotal !== undefined && invoice.taxTotal !== null)) && (
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Tax:</Text>
            <Text style={pdfStyles.totalLabel}>
              {formatCurrency(Number(invoice.tax || invoice.taxTotal || 0))}
            </Text>
          </View>
        )}
        {(invoice.discount !== undefined && invoice.discount !== null && invoice.discount > 0) && (
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>Discount:</Text>
            <Text style={pdfStyles.totalLabel}>-{formatCurrency(Number(invoice.discount))}</Text>
          </View>
        )}
        <View style={pdfStyles.grandTotalRow}>
          <Text style={pdfStyles.grandTotalLabel}>Total:</Text>
          <Text style={pdfStyles.grandTotalAmount}>
            {formatCurrency(Number(getInvoiceAmount(invoice)))}
          </Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && invoice.notes.trim() !== '' && (
        <View style={pdfStyles.notes}>
          <Text style={pdfStyles.sectionTitle}>Notes</Text>
          <Text style={pdfStyles.text}>{String(invoice.notes)}</Text>
        </View>
      )}

      {/* Payment Terms */}
      {invoice.paymentTerms && invoice.paymentTerms.trim() !== '' && (
        <View style={{ marginTop: 20, borderTop: '1 solid #ddd', paddingTop: 20 }}>
          <Text style={pdfStyles.sectionTitle}>Payment Terms</Text>
          <Text style={pdfStyles.text}>{String(invoice.paymentTerms)}</Text>
        </View>
      )}
    </Page>
  </Document>
);

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        console.log('Fetching invoice with ID:', id);
        const response = await axiosInstance.get(API_PATHS.INVOICE.GET_INVOICE_BY_ID(id));
        console.log('Invoice data:', response.data);
        
        const invoiceData = response.data?.data || response.data;
        
        console.log('📦 billFrom exists?:', !!invoiceData.billFrom);
        console.log('📦 billFrom data:', invoiceData.billFrom);
        console.log('📦 Items:', invoiceData.items);
        
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Failed to fetch invoice:', err);
        setError('Failed to load invoice details.');
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'unpaid':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(0);
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  };

  const getInvoiceAmount = (invoice) => {
    if (!invoice) return 0;
    
    // First, try to calculate from items if they exist
    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      const itemsTotal = invoice.items.reduce((sum, item) => {
        const itemTotal = item.total || (item.quantity * (item.unitPrice || item.price || 0)) || 0;
        return sum + Number(itemTotal);
      }, 0);
      
      // Add tax and subtract discount if they exist
      const tax = Number(invoice.tax || invoice.taxTotal || 0);
      const discount = Number(invoice.discount || 0);
      
      const calculatedTotal = itemsTotal + tax - discount;
      
      // If calculated total is greater than 0, return it
      if (calculatedTotal > 0) {
        return calculatedTotal;
      }
    }
    
    // If total from invoice is greater than 0, use it
    if (invoice.total !== undefined && invoice.total !== null && invoice.total > 0) {
      return Number(invoice.total);
    }
    
    // Try other possible total fields
    const possibleAmountFields = [
      'totalAmount',
      'amount',
      'grandTotal',
      'invoiceAmount',
      'finalAmount',
      'netAmount',
      'subtotal'
    ];
    
    for (const field of possibleAmountFields) {
      if (invoice[field] !== undefined && invoice[field] !== null && !isNaN(invoice[field]) && invoice[field] > 0) {
        return Number(invoice[field]);
      }
    }
    
    return 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Button>
        
        <div className="flex flex-wrap gap-3">
          {invoice.status?.toLowerCase() !== 'paid' && (
            <Button
              variant="outline"
              onClick={() => setIsReminderModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Set Reminder
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/invoices/edit/${id}`, { state: { invoice } })}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          
          <PDFDownloadLink
            document={
              <InvoicePDF 
                invoice={invoice} 
                formatCurrency={formatCurrency} 
                getInvoiceAmount={getInvoiceAmount} 
              />
            }
            fileName={`invoice-${invoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-lg shadow-lg border p-8 md:p-12">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-gray-600">
                Invoice Number: <span className="font-semibold">{invoice.invoiceNumber}</span>
              </p>
              <p className="text-gray-600">
                Date: <span className="font-semibold">{moment(invoice.invoiceDate).format('MMM DD, YYYY')}</span>
              </p>
              {invoice.dueDate && (
                <p className="text-gray-600">
                  Due Date: <span className="font-semibold">{moment(invoice.dueDate).format('MMM DD, YYYY')}</span>
                </p>
              )}
            </div>
            
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill From and Bill To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bill From */}
          {invoice.billFrom && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill From</h3>
              <div className="text-gray-900">
                <p className="font-semibold text-lg">
                  {invoice.billFrom.businessName || invoice.billFrom.companyName || 'N/A'}
                </p>
                {invoice.billFrom.address && <p>{invoice.billFrom.address}</p>}
                {invoice.billFrom.email && <p>{invoice.billFrom.email}</p>}
                {invoice.billFrom.phone && <p>{invoice.billFrom.phone}</p>}
              </div>
            </div>
          )}

          {/* Bill To */}
          {invoice.billTo && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
              <div className="text-gray-900">
                <p className="font-semibold text-lg">{invoice.billTo.clientName}</p>
                {invoice.billTo.address && <p>{invoice.billTo.address}</p>}
                {invoice.billTo.email && <p>{invoice.billTo.email}</p>}
                {invoice.billTo.phone && <p>{invoice.billTo.phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Description</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Quantity</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Unit Price</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-4 px-2">
                    <p className="font-medium text-gray-900">
                      {item.description || item.name}
                    </p>
                    {item.details && <p className="text-sm text-gray-600">{item.details}</p>}
                  </td>
                  <td className="text-right py-4 px-2 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-4 px-2 text-gray-900">
                    {formatCurrency(item.unitPrice || item.price)}
                  </td>
                  <td className="text-right py-4 px-2 font-medium text-gray-900">
                    {formatCurrency(item.total || (item.quantity * (item.unitPrice || item.price)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-1/2 lg:w-1/3">
            {(invoice.subtotal !== undefined && invoice.subtotal !== null) && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
            )}
            
            {(invoice.tax || invoice.taxTotal) && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Tax:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoice.tax || invoice.taxTotal)}
                </span>
              </div>
            )}
            
            {invoice.discount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Discount:</span>
                <span className="font-medium text-gray-900">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-2">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(getInvoiceAmount(invoice))}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && invoice.notes.trim() !== '' && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Terms */}
        {invoice.paymentTerms && invoice.paymentTerms.trim() !== '' && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Payment Terms</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.paymentTerms}</p>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <ReminderModal
          invoice={invoice}
          onClose={() => setIsReminderModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InvoiceDetail;
