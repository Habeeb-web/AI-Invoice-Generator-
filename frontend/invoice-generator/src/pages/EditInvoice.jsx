import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Loader2, ArrowLeft, Save, Plus } from 'lucide-react';

const initialItem = () => ({
  name: '',
  quantity: 1,
  unitPrice: 0,
  taxPercent: 0,
  total: 0,
});

const defaultFormData = {
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  billFrom: { 
    businessName: '',
    email: '',
    address: '',
    phone: ''
  },
  billTo: { 
    clientName: '',
    email: '',
    address: '',
    phone: ''
  },
  items: [initialItem()],
  notes: '',
  status: 'Unpaid',
};

const EditInvoice = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(true);

  // Load invoice data on mount
  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      try {
        let invoice = state?.invoice;
        if (!invoice && id) {
          const response = await axiosInstance.get(API_PATHS.INVOICE.GET_INVOICE_BY_ID(id));
          invoice = response.data?.data || response.data;
        }
        if (invoice) {
          setFormData({
            invoiceNumber: invoice.invoiceNumber || '',
            invoiceDate: invoice.invoiceDate
              ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
            dueDate: invoice.dueDate
              ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
            billFrom: {
              businessName: invoice.billFrom?.businessName || '',
              email: invoice.billFrom?.email || '',
              address: invoice.billFrom?.address || '',
              phone: invoice.billFrom?.phone || ''
            },
            billTo: {
              clientName: invoice.billTo?.clientName || '',
              email: invoice.billTo?.email || '',
              address: invoice.billTo?.address || '',
              phone: invoice.billTo?.phone || ''
            },
            items: Array.isArray(invoice.items) && invoice.items.length > 0
              ? invoice.items.map(item => ({
                  name: item.name || item.description || '',
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || item.price || 0,
                  taxPercent: item.taxPercent || 0,
                  total: item.total || 0
                }))
              : [initialItem()],
            notes: invoice.notes || '',
            status: invoice.status || 'Unpaid'
          });
        } else {
          toast.error("Invoice not found.");
          navigate('/invoices');
        }
      } catch (err) {
        toast.error("Failed to load invoice.");
        navigate('/invoices');
      }
      setLoading(false);
    }
    fetchInvoice();
    // eslint-disable-next-line
  }, [id, state, navigate]);

  // Calculate totals on every items change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const taxPercent = Number(item.taxPercent) || 0;
        const itemSubtotal = quantity * unitPrice;
        const itemTax = itemSubtotal * (taxPercent / 100);
        return {
          ...item,
          total: Number((itemSubtotal + itemTax).toFixed(2))
        };
      })
    }));
    // eslint-disable-next-line
  }, [formData.items.length]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith('billFrom.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billFrom: { ...prev.billFrom, [field]: value }
      }));
    } else if (name.startsWith('billTo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billTo: { ...prev.billTo, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleItemChange = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx
          ? { ...item, [field]: (field === 'name' ? value : Number(value) || 0) }
          : item
      )
    }));
  };

  const addItem = () =>
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, initialItem()]
    }));

  const removeItem = idx =>
    setFormData(prev => ({
      ...prev,
      items: prev.items.length > 1
        ? prev.items.filter((_item, i) => i !== idx)
        : prev.items
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!formData.billFrom.businessName?.trim()) return toast.error('Business name required');
    if (!formData.billTo.clientName?.trim()) return toast.error('Client name required');
    if (!formData.items.every(item =>
      item.name && item.quantity && !isNaN(item.quantity) && item.unitPrice !== undefined && !isNaN(item.unitPrice)
    )) return toast.error('Please fill all item fields with valid values');

    // Prepare numbers for backend
    const items = formData.items.map(item => ({
      name: item.name,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      taxPercent: Number(item.taxPercent) || 0,
      total: Number(item.total) || 0,
    }));

    // Totals
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxTotal = items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.taxPercent / 100)), 0);
    const total = subtotal + taxTotal;

    try {
      const invoiceData = {
        ...formData,
        items,
        subtotal,
        taxTotal,
        total,
      };
      await axiosInstance.put(
        API_PATHS.INVOICE.UPDATE_INVOICE(id),
        invoiceData
      );
      toast.success("Invoice updated successfully!");
      navigate("/invoices");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to update invoice. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading invoice...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Button>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white border rounded-xl shadow p-6 space-y-8">
        {/* Bill From */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Bill From</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="billFrom.businessName"
              value={formData.billFrom.businessName}
              placeholder="Your Business Name"
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="email"
              name="billFrom.email"
              value={formData.billFrom.email}
              placeholder="Your Email"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="billFrom.address"
              value={formData.billFrom.address}
              placeholder="Your Address"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="tel"
              name="billFrom.phone"
              value={formData.billFrom.phone}
              placeholder="Your Phone"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Bill To */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Bill To</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="billTo.clientName"
              value={formData.billTo.clientName}
              placeholder="Client Name"
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="email"
              name="billTo.email"
              value={formData.billTo.email}
              placeholder="Client Email"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="billTo.address"
              value={formData.billTo.address}
              placeholder="Client Address"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="tel"
              name="billTo.phone"
              value={formData.billTo.phone}
              placeholder="Client Phone"
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
          <div className="space-y-4">
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap gap-4 items-end border-b pb-4">
                <input
                  type="text"
                  value={item.name}
                  onChange={e => handleItemChange(idx, 'name', e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  step="1"
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-20 px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  min="0"
                  step="0.01"
                  onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                  placeholder="Unit Price"
                  className="w-28 px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  value={item.taxPercent}
                  min="0"
                  step="0.01"
                  onChange={e => handleItemChange(idx, 'taxPercent', e.target.value)}
                  placeholder="Tax %"
                  className="w-20 px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  value={item.total.toFixed(2)}
                  readOnly
                  className="w-28 px-3 py-2 border rounded-lg bg-gray-100"
                  placeholder="Total"
                />
                {formData.items.length > 1 && (
                  <Button type="button" variant="ghost" onClick={() => removeItem(idx)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Additional notes"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="flex items-center gap-2">
            <Save className="w-5 h-5" /> Update Invoice
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
