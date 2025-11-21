import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Plus, Trash2, Sparkles, ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import { useAuth } from "../../context/AuthContext";
import CreateInvoiceWithAI from '../../components/CreateInvoiceWithAI';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const existingInvoice = location.state?.invoice;
  
  const [formData, setFormData] = useState(
    existingInvoice || {
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      billFrom: {
        businessName: user?.businessName || "",
        email: user?.email || "",
        address: user?.address || "",
        phone: user?.phone || ""
      },
      billTo: { 
        clientName: "", 
        email: "", 
        address: "", 
        phone: "" 
      },
      items: [{ 
        name: "", 
        quantity: 1, 
        unitPrice: 0, 
        taxPercent: 0 
      }],
      notes: "",
    }
  );

  const [loading, setLoading] = useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(!existingInvoice);
  const [showAIModal, setShowAIModal] = useState(false);

useEffect(() => {
  const aiData = location.state?.aiData;
  if (aiData) {
    console.log('✅ AI Data from navigation:', aiData);
    
    setFormData(prev => ({
      ...prev,
      invoiceNumber: aiData.invoiceNumber || prev.invoiceNumber,
      invoiceDate: aiData.invoiceDate || prev.invoiceDate,
      dueDate: aiData.dueDate || prev.dueDate,
      billTo: {
        clientName: aiData.billTo?.clientName || prev.billTo.clientName,
        email: aiData.billTo?.email || prev.billTo.email,
        address: aiData.billTo?.address || prev.billTo.address,
        phone: aiData.billTo?.phone || prev.billTo.phone,
      },
      items: aiData.items && aiData.items.length > 0 
        ? aiData.items.map(item => ({
            name: item.name || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            taxPercent: Number(item.taxPercent) || 0,
          }))
        : prev.items,
      notes: aiData.notes || prev.notes,
    }));
  }

  if (existingInvoice) {
    setFormData({
      ...existingInvoice,
      invoiceDate: moment(existingInvoice.invoiceDate).format("YYYY-MM-DD"),
      dueDate: moment(existingInvoice.dueDate).format("YYYY-MM-DD"),
    });
  } else if (!aiData) {
    generateInvoiceNumber();
  }
}, [existingInvoice, location.state]);


  const generateInvoiceNumber = async () => {
    setIsGeneratingNumber(true);
    try {
      const response = await axiosInstance.get(API_PATHS.INVOICE.GET_ALL_INVOICES);
      const invoices = response.data?.data || response.data || [];
      let maxNum = 0;
      
      invoices.forEach((inv) => {
        if (inv.invoiceNumber && inv.invoiceNumber.includes('-')) {
          const numPart = inv.invoiceNumber.split("-")[1];
          const num = parseInt(numPart);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      
      const newInvoiceNumber = `INV-${String(maxNum + 1).padStart(3, "0")}`;
      setFormData((prev) => ({ ...prev, invoiceNumber: newInvoiceNumber }));
    } catch (error) {
      console.error("Failed to generate invoice number", error);
      const fallbackNumber = `INV-${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ 
        ...prev, 
        invoiceNumber: fallbackNumber 
      }));
    }
    setIsGeneratingNumber(false);
  };

  const handleInputChange = (e, section, index) => {
    const { name, value } = e.target;
    
    if (section === "billFrom" || section === "billTo") {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else if (section === "items") {
      const updatedItems = [...formData.items];
      
      let processedValue = value;
      if (name === "quantity" || name === "unitPrice" || name === "taxPercent") {
        if (value === "" || value === null) {
          processedValue = "";
        } else {
          processedValue = value.replace(/^0+(?=\d)/, '');
          if (processedValue === '' || processedValue === '.') {
            processedValue = value;
          }
        }
      }
      
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: processedValue
      };
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, unitPrice: 0, taxPercent: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Calculate totals
  const { subtotal, taxTotal, total } = formData.items.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const taxPercent = Number(item.taxPercent) || 0;
    
    const itemTotal = quantity * unitPrice;
    const itemTax = itemTotal * (taxPercent / 100);
    
    return {
      subtotal: acc.subtotal + itemTotal,
      taxTotal: acc.taxTotal + itemTax,
      total: acc.total + itemTotal + itemTax
    };
  }, { subtotal: 0, taxTotal: 0, total: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate form
    if (!formData.billFrom.businessName.trim()) {
      toast.error("Business name is required");
      setLoading(false);
      return;
    }

    if (!formData.billTo.clientName.trim()) {
      toast.error("Client name is required");
      setLoading(false);
      return;
    }
    
    if (formData.items.some(item => !item.name.trim())) {
      toast.error("All items must have a name");
      setLoading(false);
      return;
    }

try {
  const invoiceData = {
    invoiceNumber: formData.invoiceNumber,
    invoiceDate: formData.invoiceDate,
    dueDate: formData.dueDate,
    billFrom: {
      businessName: formData.billFrom.businessName,
      email: formData.billFrom.email,
      address: formData.billFrom.address,
      phone: formData.billFrom.phone
    },
    billTo: {
      clientName: formData.billTo.clientName,
      email: formData.billTo.email,
      address: formData.billTo.address,
      phone: formData.billTo.phone
    },
    items: formData.items.map(item => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxPercent = Number(item.taxPercent) || 0;
      
      const itemSubtotal = quantity * unitPrice;
      const itemTax = itemSubtotal * (taxPercent / 100);
      const itemTotal = itemSubtotal + itemTax;
      
      return {
        name: item.name || '',
        quantity: quantity,
        unitPrice: unitPrice,
        taxPercent: taxPercent,
        total: parseFloat(itemTotal.toFixed(2))
      };
    }),
    subtotal: parseFloat(subtotal.toFixed(2)) || 0,
    taxTotal: parseFloat(taxTotal.toFixed(2)) || 0,
    total: parseFloat(total.toFixed(2)) || 0,
    notes: formData.notes || '',
    status: existingInvoice ? formData.status : "Unpaid"
  };

  console.log("📤 Submitting invoice data:", JSON.stringify(invoiceData, null, 2));

  let response;
  if (existingInvoice) {
    response = await axiosInstance.put(
      API_PATHS.INVOICE.UPDATE_INVOICE(existingInvoice._id),
      invoiceData
    );
  } else {
    response = await axiosInstance.post(
      API_PATHS.INVOICE.CREATE_INVOICE,
      invoiceData
    );
  }

  console.log("✅ API Response:", response);
  if (response.data) {
    toast.success(existingInvoice ? "Invoice updated successfully!" : "Invoice created successfully!");
    navigate("/invoices");
  }
    } catch (error) {
      console.error("❌ Failed to save invoice:", error);
      
      if (error.response) {
        console.error("📊 Error response data:", error.response.data);
        console.error("🔢 Error status:", error.response.status);
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error ||
                            "Server error: Please try again later.";
        toast.error(errorMessage);
      } else if (error.request) {
        console.error("📡 No response received:", error.request);
        toast.error("Network error: Please check your connection and try again.");
      } else {
        console.error("⚡ Error message:", error.message);
        toast.error("Unexpected error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {existingInvoice ? "Edit Invoice" : "Create New Invoice"}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create with AI
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number *
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange(e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isGeneratingNumber}
              />
              {isGeneratingNumber && (
                <p className="text-sm text-gray-500 mt-1">Generating...</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange(e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={(e) => handleInputChange(e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Bill From Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill From (Your Business)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.billFrom.businessName}
                onChange={(e) => handleInputChange(e, "billFrom")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.billFrom.email}
                onChange={(e) => handleInputChange(e, "billFrom")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.billFrom.phone}
                onChange={(e) => handleInputChange(e, "billFrom")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.billFrom.address}
                onChange={(e) => handleInputChange(e, "billFrom")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To (Client)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.billTo.clientName}
                onChange={(e) => handleInputChange(e, "billTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.billTo.email}
                onChange={(e) => handleInputChange(e, "billTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.billTo.phone}
                onChange={(e) => handleInputChange(e, "billTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.billTo.address}
                onChange={(e) => handleInputChange(e, "billTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={item.name}
                    onChange={(e) => handleInputChange(e, "items", index)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qty
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleInputChange(e, "items", index)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={item.unitPrice}
                    onChange={(e) => handleInputChange(e, "items", index)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax %
                  </label>
                  <input
                    type="number"
                    name="taxPercent"
                    value={item.taxPercent}
                    onChange={(e) => handleInputChange(e, "items", index)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 gap-4 max-w-xs ml-auto">
            <div className="text-right text-gray-600">Subtotal:</div>
            <div className="text-right font-medium">₹{subtotal.toFixed(2)}</div>
            
            <div className="text-right text-gray-600">Tax Total:</div>
            <div className="text-right font-medium">₹{taxTotal.toFixed(2)}</div>
            
            <div className="text-right text-lg font-semibold border-t pt-2">Total:</div>
            <div className="text-right text-lg font-semibold border-t pt-2 text-blue-600">₹{total.toFixed(2)}</div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange(e)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes or terms..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {existingInvoice ? "Update Invoice" : "Create Invoice"}
              </>
            )}
          </button>
        </div>
      </form>

{/* AI Modal */}
{showAIModal && (
  <CreateInvoiceWithAI
    onClose={() => setShowAIModal(false)}
    onInvoiceCreated={(aiData) => {
      console.log('✅ AI Data received:', aiData);
      console.log('✅ Items received:', aiData.items);
      
      // Populate form with AI-extracted data
      setFormData(prev => ({
        ...prev,
        invoiceNumber: aiData.invoiceNumber || prev.invoiceNumber,
        invoiceDate: aiData.invoiceDate || prev.invoiceDate,
        dueDate: aiData.dueDate || prev.dueDate,
        billTo: {
          clientName: aiData.billTo?.clientName || prev.billTo.clientName,
          email: aiData.billTo?.email || prev.billTo.email,           // ✅ Direct mapping
          address: aiData.billTo?.address || prev.billTo.address,     // ✅ Direct mapping
          phone: aiData.billTo?.phone || prev.billTo.phone,           // ✅ Direct mapping
        },
        items: aiData.items && aiData.items.length > 0 
          ? aiData.items.map((item, index) => {
              console.log(`✅ Mapping item ${index}:`, item);
              return {
                name: item.name || '',
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                taxPercent: Number(item.taxPercent) || 0,
              };
            })
          : prev.items,
        notes: aiData.notes || prev.notes,
      }));
      
      console.log('✅ Form updated successfully');
      toast.success('Invoice data loaded from AI! Review and create invoice.');
      setShowAIModal(false);
    }}
  />
)}


    </div>
  );
};

export default CreateInvoice;
