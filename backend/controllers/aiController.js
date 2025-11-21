const { GoogleGenerativeAI } = require("@google/generative-ai");
const Invoice = require("../models/Invoice");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseInvoiceFromText = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text is required" });
  }

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            clientName: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" }
                }
              }
            }
          }
        }
      }
    });

    const prompt = `
    Extract invoice information from this text:
    ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const parsedData = JSON.parse(responseText);
    
    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error parsing invoice with AI:", error);
    res.status(500).json({ 
      message: "Failed to parse invoice data from text.", 
      details: error.message 
    });
  }
};

const generateReminderEmail = async (req, res) => {
  try {
    const { invoiceId, clientName, amount, dueDate } = req.body;
    
    if (!invoiceId || !clientName || !amount || !dueDate) {
      return res.status(400).json({ 
        message: "Invoice ID, client name, amount, and due date are required",
        received: { invoiceId, clientName, amount, dueDate }
      });
    }

    const prompt = `
    Write a professional payment reminder email for an invoice.
    
    Invoice ID: ${invoiceId}
    Client: ${clientName}
    Amount Due: $${amount}
    Due Date: ${dueDate}
    
    Write a polite but firm reminder email.
    `;

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emailContent = response.text();

    res.status(200).json({ 
      success: true, 
      emailContent 
    });
  } catch (error) {
    console.error("Error generating reminder email with AI:", error);
    res.status(500).json({ 
      message: "Failed to generate reminder email.", 
      details: error.message 
    });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id });
    
    if (invoices.length === 0) {
      return res.status(200).json({ 
        insights: ["No invoice data available to generate insights."] 
      });
    }

    // Process and summarize data
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid');
    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalOutstanding = unpaidInvoices.reduce((acc, inv) => acc + inv.total, 0);

    const dataSummary = `
      - Total number of invoices: ${totalInvoices}
      - Total paid invoices: ${paidInvoices.length}
      - Total unpaid/pending invoices: ${unpaidInvoices.length}
      - Total revenue from paid invoices: $${totalRevenue.toFixed(2)}
      - Total outstanding amount from unpaid/pending invoices: $${totalOutstanding.toFixed(2)}
      - Recent invoices (last 5): ${invoices.slice(0, 5).map(inv => `Invoice #${inv.invoiceNumber} for $${inv.total.toFixed(2)} with status ${inv.status}`).join(', ')}
    `;

    const prompt = `
    Analyze this invoice data and provide a concise business summary with insights.
    
    ${dataSummary}
    
    Return your response as a valid JSON object with a single key "insights" which is an array of strings.
    Example format: { "insights": ["Your revenue is looking strong this month!", "You have 5 overdue invoices"] }
    
    Provide insights about:
    1. Revenue trends
    2. Top clients (if data available)
    3. Payment status overview
    4. Recommendations for improving cash flow
    `;

    // ✅ FIXED: Added missing API call lines
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);  // ✅ Call API
    const apiResponse = await result.response;           // ✅ Get response
    const responseText = apiResponse.text();             // ✅ Use apiResponse
    const cleanedJson = responseText.replace(/``````/g, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error dashboard summary with AI:", error);
    res.status(500).json({ 
      message: "Failed to generate dashboard summary.", 
      details: error.message 
    });
  }
};

module.exports = { 
  parseInvoiceFromText, 
  generateReminderEmail, 
  getDashboardSummary 
};
