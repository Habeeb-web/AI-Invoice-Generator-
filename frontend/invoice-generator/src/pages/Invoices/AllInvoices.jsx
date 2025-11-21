import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Loader2, Trash2, Edit, Search, FileText, Plus, AlertCircle, Sparkles, Bell } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import CreateInvoiceWithAI from '../../components/CreateInvoiceWithAI';
import ReminderModal from '../../components/ReminderModal';


const AllInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
        console.log('Raw API response:', response.data);
        
        const invoiceData = response.data?.data || response.data || [];
        const sortedInvoices = invoiceData.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
        setInvoices(sortedInvoices);
        
        if (sortedInvoices.length > 0) {
          console.log('First invoice details:', {
            total: sortedInvoices[0].total,
            status: sortedInvoices[0].status,
            allKeys: Object.keys(sortedInvoices[0])
          });
        }
      } catch (err) {
        setError('Failed to fetch invoices.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      await axiosInstance.delete(API_PATHS.INVOICE.DELETE_INVOICE(id));
      setInvoices(invoices.filter(invoice => invoice._id !== id));
    } catch (err) {
      setError('Failed to delete invoice.');
      console.error(err);
    }
  };


  const handleStatusChange = async (invoiceId, newStatus) => {
    setStatusChangeLoading(invoiceId);
    try {
      await axiosInstance.put(
        API_PATHS.INVOICE.UPDATE_INVOICE(invoiceId),
        { status: newStatus }
      );
      
      setInvoices(invoices.map(invoice => 
        invoice._id === invoiceId ? { ...invoice, status: newStatus } : invoice
      ));
    } catch (err) {
      setError('Failed to update invoice status.');
      console.error('Status change error:', err);
    } finally {
      setStatusChangeLoading(null);
    }
  };


  const handleSetReminder = (invoice) => {
    setSelectedInvoice(invoice);
    setIsReminderModalOpen(true);
  };


  const handleEditInvoice = (invoice) => {
    console.log('🔵 Edit button clicked');
    console.log('🔵 Invoice ID:', invoice._id);
    console.log('🔵 Invoice data:', invoice);
    console.log('🔵 Navigating to:', `/invoices/edit/${invoice._id}`);
    
    navigate(`/invoices/edit/${invoice._id}`, { state: { invoice } });
  };


  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        if (statusFilter === 'All') return true;
        return invoice.status?.toLowerCase() === statusFilter.toLowerCase();
      })
      .filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.billTo.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [invoices, searchTerm, statusFilter]);


  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid':
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const getInvoiceAmount = (invoice) => {
    if (!invoice) return 0;
    
    const possibleAmountFields = [
      'total',
      'totalAmount',
      'amount',
      'grandTotal',
      'invoiceAmount',
      'finalAmount',
      'netAmount'
    ];
    
    for (const field of possibleAmountFields) {
      if (invoice[field] !== undefined && invoice[field] !== null && !isNaN(invoice[field])) {
        return Number(invoice[field]);
      }
    }
    
    if (invoice.items && Array.isArray(invoice.items)) {
      const calculatedTotal = invoice.items.reduce((sum, item) => {
        const itemTotal = item.total || (item.quantity * item.unitPrice) || 0;
        return sum + itemTotal;
      }, 0);
      return calculatedTotal;
    }
    
    return 0;
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


  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-600 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Invoices</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all your invoices in one place
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>


      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by invoice number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>


      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'All' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first invoice.'}
            </p>
            {!searchTerm && statusFilter === 'All' && (
              <Button onClick={() => navigate('/invoices/new')}>
                Create Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.billTo.clientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {moment(invoice.invoiceDate).format('MMM DD, YYYY')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(getInvoiceAmount(invoice))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice._id, e.target.value)}
                        disabled={statusChangeLoading === invoice._id}
                        className={`text-xs font-medium px-3 py-1 rounded-full border-0 ${getStatusColor(invoice.status)} focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/invoices/${invoice._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="View Invoice"
                          type="button"
                        >
                          <FileText className="w-4 h-4 pointer-events-none" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleEditInvoice(invoice);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors"
                          title="Edit Invoice"
                          type="button"
                        >
                          <Edit className="w-4 h-4 pointer-events-none" />
                        </button>
                        {invoice.status?.toLowerCase() !== 'paid' && (
                          <button
                            onClick={() => handleSetReminder(invoice)}
                            className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition-colors"
                            title="Set Reminder"
                            type="button"
                          >
                            <Bell className="w-4 h-4 pointer-events-none" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice._id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete Invoice"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* AI Assistant Modal */}
      {isAiModalOpen && (
        <CreateInvoiceWithAI 
          onClose={() => setIsAiModalOpen(false)} 
          onInvoiceCreated={(aiData) => {
            console.log('✅ AI Data received in AllInvoices:', aiData);
            
            setIsAiModalOpen(false);
            
            setTimeout(() => {
              navigate('/invoices/create', { 
                state: { 
                  aiData: aiData 
                } 
              });
            }, 100);
          }}
        />
      )}


      {/* Reminder Modal */}
      {isReminderModalOpen && selectedInvoice && (
        <ReminderModal 
          invoice={selectedInvoice}
          onClose={() => {
            setIsReminderModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};


export default AllInvoices;
