import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Loader2, FileText, DollarSign, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import Button from "../../components/ui/Button";
import AIInsightsCard from "../../components/ui/AIInsightsCard";

const Dashboard = () => {
  const [stats, setStats] = useState({ 
    totalInvoices: 0, 
    totalPaid: 0, 
    totalUnpaid: 0, 
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => { 
      try {
        const response = await axiosInstance.get( 
          API_PATHS.INVOICE.GET_ALL_INVOICES 
        );
        const invoices = response.data;
        
        // Debug: Check the first invoice structure
        if (invoices.length > 0) {
          console.log('📋 First invoice data:', invoices[0]);
          console.log('🔍 Client data structure:', invoices[0].billTo);
        }
        
        const totalInvoices = invoices.length;
        const totalPaid = invoices 
          .filter((inv) => inv.status === "paid" || inv.status === "Paid") 
          .reduce((acc, inv) => acc + getInvoiceAmount(inv), 0);
        const totalUnpaid = invoices 
          .filter((inv) => inv.status !== "paid" && inv.status !== "Paid") 
          .reduce((acc, inv) => acc + getInvoiceAmount(inv), 0);
        
        setStats({ totalInvoices, totalPaid, totalUnpaid });
        setRecentInvoices(
          invoices 
            .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
            .slice(0, 5)
        ); 
      } catch (error) { 
        console.error("Failed to fetch dashboard data", error); 
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to get invoice amount from various fields
  const getInvoiceAmount = (invoice) => {
    if (!invoice) return 0;
    
    const possibleAmountFields = [
      'totalAmount',
      'amount',
      'total',
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
    
    return 0;
  };

  // Helper function to get client name from various structures
  const getClientName = (invoice) => {
    if (!invoice) return "N/A";
    
    console.log('🔍 Checking client name for:', invoice._id, invoice.billTo); // Debug
    
    // Check all possible client name locations
    const possibleNames = [
      invoice.billTo?.clientName,  // Most common structure
      invoice.clientName,
      invoice.client?.name,
      invoice.customerName,
      invoice.customer?.name,
      invoice.billTo?.name,
      invoice.billTo?.client?.name,
    ].filter(name => name && typeof name === 'string' && name.trim() !== '');
    
    return possibleNames[0] || "N/A";
  };

  // Helper function to get status with proper casing
  const getStatus = (invoice) => {
    if (!invoice.status) return "draft";
    return invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase();
  };

  const statsData = [
    {
      icon: FileText,
      label: "Total Invoices",
      value: stats.totalInvoices,
      color: "blue",
    },
    {
      icon: DollarSign,
      label: "Total Paid",
      value: `₹${stats.totalPaid.toLocaleString('en-IN')}`,
      color: "emerald",
    },
    {
      icon: DollarSign,
      label: "Total Unpaid",
      value: `₹${stats.totalUnpaid.toLocaleString('en-IN')}`,
      color: "red",
    },
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" }, 
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" }, 
    red: { bg: "bg-red-100", text: "text-red-600" }, 
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'paid': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'overdue': return "bg-red-100 text-red-800";
      case 'draft': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return ( 
      <div className="flex justify-center items-center h-96"> 
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">
              A quick overview of your business finances.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => navigate("/invoices/new")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-12 h-12 ${
                  colorClasses[stat.color].bg
                } rounded-lg flex items-center justify-center`}
              >
                <stat.icon
                  className={`w-6 h-6 ${colorClasses[stat.color].text}`}
                />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-600">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/*AI Insights*/}
      <AIInsightsCard/>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Invoices</h3>
          <Button 
            variant="outline" 
            onClick={() => navigate("/invoices/new")}
          >
            View All
          </Button>
        </div>
        
        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Invoice #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {getClientName(invoice)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invoice.invoiceDate ? moment(invoice.invoiceDate).format("MMM DD, YYYY") : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invoice.dueDate ? moment(invoice.dueDate).format("MMM DD, YYYY") : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      ₹{getInvoiceAmount(invoice).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                      >
                        {getStatus(invoice)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No invoices found</p>
            <Button 
              variant="primary" 
              onClick={() => navigate("/invoices/new")}
            >
              Create Your First Invoice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;