import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './ui/Button';

const CreateInvoiceWithAI = ({ onClose, onInvoiceCreated }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('input');

  // Enhanced AI parser (frontend only)
const parseInvoiceText = (text) => {
  console.log('🔍 Parsing text:', text);
  
  // Extract invoice number
  const invoiceNumberMatch = text.match(/(?:invoice|inv)[\s#:-]*([a-zA-Z0-9-]+)/i) || 
                            text.match(/(?:number|no\.?)[\s:-]*([a-zA-Z0-9-]+)/i);
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/) ||
                   text.match(/(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})/);
  
  // Extract vendor/client name
  const vendorMatch = text.match(/(?:from|vendor|client|bill to|customer):?\s*([^\n\r]+)/i) ||
                     text.match(/(?:to|for):?\s*([^\n\r]+)/i);

  // ✅ FIXED: Process ALL patterns for each segment
  const items = [];
  
  // Split by comma to get individual items
  const segments = text.split(/,\s*/);
  
  segments.forEach((segment, segIndex) => {
    console.log(`📋 Segment ${segIndex}:`, segment);
    
    let matched = false;
    
    // Pattern A: "description number units @ rate" 
    // e.g., "frontend 40 hours at ₹2000/hour" or "backend 30 hours at ₹2500/hour"
    const patternA = segment.match(/([a-zA-Z\s]+?)\s+(\d+)\s+(?:hours?|months?|days?|units?|pcs?|pieces?)?\s*(?:@|at)\s*₹?\s*([0-9,]+)(?:\/(?:hour|month|day|unit|pc|piece))?/i);
    
    if (patternA && !matched) {
      const description = patternA[1].trim();
      const quantity = parseInt(patternA[2]);
      const rate = parseFloat(patternA[3].replace(/,/g, ''));
      
      if (description && quantity > 0 && rate > 0) {
        items.push({
          description: description,
          quantity: quantity,
          rate: rate,
          amount: quantity * rate
        });
        console.log('✅ Pattern A matched:', { description, quantity, rate });
        matched = true;
      }
    }
    
    // Pattern B: "number x description @ rate"
    // e.g., "40 x frontend hours @ ₹2000"
    const patternB = segment.match(/(\d+)\s*(?:x|×)\s*([a-zA-Z\s]+?)\s*(?:@|at)\s*₹?\s*([0-9,]+)/i);
    
    if (patternB && !matched) {
      const quantity = parseInt(patternB[1]);
      const description = patternB[2].trim();
      const rate = parseFloat(patternB[3].replace(/,/g, ''));
      
      if (description && quantity > 0 && rate > 0) {
        items.push({
          description: description,
          quantity: quantity,
          rate: rate,
          amount: quantity * rate
        });
        console.log('✅ Pattern B matched:', { description, quantity, rate });
        matched = true;
      }
    }
    
    // Pattern C: "description ₹amount" (no quantity, no @/at)
    // e.g., "database setup ₹15000" or "deployment ₹8000"
    const patternC = segment.match(/^([a-zA-Z\s]+?)\s*₹\s*([0-9,]+)$/i);
    
    if (patternC && !matched) {
      const description = patternC[1].trim();
      const amount = parseFloat(patternC[2].replace(/,/g, ''));
      
      // Validate: description should be meaningful (more than 2 chars)
      if (description && amount > 0 && description.length > 2) {
        items.push({
          description: description,
          quantity: 1,
          rate: amount,
          amount: amount
        });
        console.log('✅ Pattern C matched:', { description, amount });
        matched = true;
      }
    }
    
    if (!matched) {
      console.log('⚠️ No pattern matched for segment:', segment);
    }
  });

  // ✅ Calculate correct total from all items
  let totalAmount = 0;
  if (items.length > 0) {
    totalAmount = items.reduce((sum, item) => {
      const itemAmount = item.quantity * item.rate;
      console.log(`💵 ${item.description}: ${item.quantity} × ₹${item.rate} = ₹${itemAmount}`);
      return sum + itemAmount;
    }, 0);
    console.log('💰 TOTAL:', totalAmount);
  }

  // Format date properly
  let formattedDate = new Date().toISOString().split('T')[0];
  if (dateMatch) {
    const dateStr = dateMatch[1];
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parts[0].length === 2 ? parts[0] : parts[1];
        const day = parts[0].length === 2 ? parts[1] : parts[0];
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          formattedDate = dateStr;
        } else {
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
  }

  const result = {
    vendorName: vendorMatch ? vendorMatch[1].trim() : 'Client Name',
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1] : `INV-${Date.now().toString().slice(-6)}`,
    totalAmount: totalAmount,
    date: formattedDate,
    items: items.length > 0 ? items : [
      {
        description: 'Products/Services',
        quantity: 1,
        rate: 1000,
        amount: 1000
      }
    ]
  };

  console.log('✅ FINAL RESULT:', result);
  console.log(`✅ Items found: ${items.length}`);
  console.log(`✅ Total: ₹${totalAmount.toLocaleString()}`);
  
  return result;
};


  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter invoice text');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    setTimeout(() => {
      try {
        const parsedResult = parseInvoiceText(text.trim());
        setResult(parsedResult);
        setStep('result');
      } catch (err) {
        console.error('Parsing error:', err);
        setError('Failed to parse invoice text. Please try a different format.');
        setStep('input');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

const handleUseResult = () => {
  console.log('🎯 handleUseResult called with result:', result);
  
  if (result && onInvoiceCreated) {
    const invoiceData = {
      invoiceNumber: result.invoiceNumber,
      invoiceDate: result.date,
      dueDate: result.date,
      billTo: {
        clientName: result.vendorName,
        email: '',           // ✅ Fixed: was clientEmail
        phone: '',           // ✅ Fixed: was clientPhone
        address: '',         // ✅ Fixed: was clientAddress
      },
      items: result.items.map((item, index) => {
        console.log(`📦 Item ${index}:`, {
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          calculatedAmount: item.quantity * item.rate
        });
        
        return {
          name: item.description,
          quantity: item.quantity,
          unitPrice: item.rate,
          taxPercent: 0,
        };
      }),
      notes: 'Created with AI assistance',
    };
    
    console.log('✅ Final invoice data:', invoiceData);
    console.log('✅ Items being sent:', invoiceData.items);
    onInvoiceCreated(invoiceData);
  }
};

  const handleCreateNew = () => {
    setText('');
    setResult(null);
    setError('');
    setStep('input');
  };

  return (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Invoice with AI</h2>
              <p className="text-sm text-gray-600">Paste invoice text to auto-fill the form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste invoice text
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Examples:
• 'Invoice for 2 laptops at ₹45000 each and 3 monitors at ₹8000 each'
• 'Create invoice for 5 hours consulting at ₹2000 per hour'
• 'Bill for website development: 50 hours @ ₹1500/hour'"
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Tip:</strong> Include quantities, rates, and descriptions for best results
                </div>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!text.trim() || loading}
                  className="w-full mt-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Parsing...' : 'Parse with AI'}
                </Button>
              </div>

              {/* Examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Try these examples:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• "Invoice for 2 laptops at ₹45000 each and 3 monitors at ₹8000 each"</div>
                  <div>• "Create invoice for 5 hours consulting at ₹2000 per hour"</div>
                  <div>• "Bill for website development: 50 hours @ ₹1500/hour"</div>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing with AI</h3>
              <p className="text-gray-600">Analyzing your invoice content...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Invoice Parsed Successfully!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      AI has extracted the following information from your invoice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview extracted data */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Extracted Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendor/Client:</span>
                    <span className="text-sm font-medium">{result.vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invoice #:</span>
                    <span className="text-sm font-medium">{result.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(result.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-medium">
                      {new Date(result.date).toLocaleDateString()}
                    </span>
                  </div>
                  {result.items && result.items.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Items:</span>
                      <ul className="mt-2 space-y-2">
                        {result.items.map((item, index) => (
                          <li key={index} className="text-sm bg-white p-2 rounded border">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-gray-600">
                              {item.quantity} × ₹{item.rate.toLocaleString()} = ₹{(item.quantity * item.rate).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between font-medium">
                          <span>Subtotal:</span>
                          <span>₹{result.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleUseResult}
                  className="flex-1"
                >
                  Use This Data to Create Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateNew}
                >
                  Try Another
                </Button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Next Steps</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      After clicking "Use This Data", the invoice form will be pre-filled. 
                      You can review and edit the details before creating the final invoice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceWithAI;
