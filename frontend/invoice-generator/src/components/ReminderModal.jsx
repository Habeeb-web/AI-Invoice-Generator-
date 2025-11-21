import React, { useState } from 'react';
import { X, Mail, Sparkles, Send, Copy, Check } from 'lucide-react';
import Button from './ui/Button';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';

const ReminderModal = ({ invoice, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [subject, setSubject] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate AI email content
  const generateEmail = () => {
    setGeneratingEmail(true);
    
    setTimeout(() => {
      const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
      const isOverdue = daysOverdue > 0;
      
      const generatedSubject = isOverdue 
        ? `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${daysOverdue} Days Overdue`
        : `Payment Reminder: Invoice ${invoice.invoiceNumber}`;
      
      // ✅ Safe access to billFrom with defaults
      const businessName = invoice.billFrom?.businessName || invoice.billFrom?.name || 'Your Business';
      const businessEmail = invoice.billFrom?.email || '';
      const businessPhone = invoice.billFrom?.phone || '';
      
      // ✅ Safe access to billTo with defaults
      const clientName = invoice.billTo?.clientName || invoice.billTo?.name || 'Valued Client';
      
      // ✅ Safe access to amounts
      const totalAmount = invoice.total || invoice.totalAmount || invoice.amount || 0;
      
      const generatedContent = `Dear ${clientName},

I hope this email finds you well.

This is a friendly reminder regarding Invoice ${invoice.invoiceNumber}, dated ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}.

Invoice Details:
• Invoice Number: ${invoice.invoiceNumber}
• Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
• Amount Due: ₹${totalAmount.toLocaleString('en-IN')}

${isOverdue 
  ? `This invoice is currently ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. We kindly request your immediate attention to settle this outstanding payment.`
  : 'Payment is due soon. We would appreciate your prompt attention to this matter.'}

If you have already made the payment, please disregard this reminder. If you have any questions or concerns regarding this invoice, please don't hesitate to reach out.

Payment can be made to:
${businessName}${businessEmail ? `\nEmail: ${businessEmail}` : ''}${businessPhone ? `\nPhone: ${businessPhone}` : ''}

Thank you for your business and cooperation.

Best regards,
${businessName}`;

      setSubject(generatedSubject);
      setEmailContent(generatedContent);
      setGeneratingEmail(false);
    }, 1500);
  };

  // Auto-generate on mount
  React.useEffect(() => {
    if (invoice) {
      generateEmail();
    }
  }, [invoice]);

  const handleCopyEmail = () => {
    const fullEmail = `Subject: ${subject}\n\n${emailContent}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual email sending via your backend
      await axiosInstance.post(API_PATHS.INVOICE.SEND_REMINDER, {
        invoiceId: invoice._id,
        to: invoice.billTo?.email || invoice.billTo?.clientEmail,
        subject: subject,
        content: emailContent
      });
      
      toast.success('Reminder sent successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe access to invoice data
  const clientEmail = invoice.billTo?.email || invoice.billTo?.clientEmail || '';
  const totalAmount = invoice.total || invoice.totalAmount || invoice.amount || 0;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Reminder</h2>
              <p className="text-sm text-gray-600">Invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Client:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {invoice.billTo?.clientName || invoice.billTo?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Amount:</span>
                <span className="ml-2 font-medium text-blue-900">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Due Date:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Status:</span>
                <span className={`ml-2 font-medium ${
                  invoice.status?.toLowerCase() === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {invoice.status || 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {generatingEmail ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Email with AI</h3>
              <p className="text-gray-600">Creating a professional reminder email...</p>
            </div>
          ) : (
            <>
              {/* Email Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email Content */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Content
                  </label>
                  <button
                    onClick={generateEmail}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate with AI
                  </button>
                </div>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={16}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                />
              </div>

              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                {!clientEmail && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ No email address available for this client. Please add email to the invoice.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Email
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={loading || !clientEmail}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
