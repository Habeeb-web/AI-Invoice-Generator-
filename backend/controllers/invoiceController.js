const Invoice = require("../models/Invoice");

// @desc Create new invoice
// @route POST /api/invoices
// @access Private
exports.createInvoice = async (req, res) => {
    try {
        console.log('🔍 CREATE INVOICE - Full request body:');
        console.log(JSON.stringify(req.body, null, 2));
        
        const userId = req.user.id;
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
        } = req.body;

        // Validate and sanitize items
        const sanitizedItems = items.map(item => ({
            name: item.name || '',
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            taxPercent: Number(item.taxPercent) || 0,
            total: Number(item.total) || 0
        }));

        // Subtotal calculation with proper number handling
        let subtotal = 0;
        let taxTotal = 0;
        
        sanitizedItems.forEach((item) => {
            const itemSubtotal = item.unitPrice * item.quantity;
            const itemTax = itemSubtotal * (item.taxPercent / 100);
            subtotal += itemSubtotal;
            taxTotal += itemTax;
        });

        const total = subtotal + taxTotal;

        console.log('💰 Calculated totals:', { subtotal, taxTotal, total });

        const invoice = new Invoice({
            user: userId,
            invoiceNumber: invoiceNumber || '',
            invoiceDate: invoiceDate || new Date(),
            dueDate: dueDate || new Date(),
            billFrom: billFrom || {},
            billTo: billTo || {},
            items: sanitizedItems,
            notes: notes || '',
            paymentTerms: paymentTerms || '',
            subtotal: Number(subtotal) || 0,
            taxTotal: Number(taxTotal) || 0,
            total: Number(total) || 0,
        });

        console.log('💾 About to save invoice...');

        await invoice.save();
        
        console.log('✅ Invoice saved successfully!');
        console.log('📦 Saved with billFrom:', invoice.billFrom);

        res.status(201).json(invoice);
    } catch (error) {
        console.error('❌ CRITICAL ERROR creating invoice:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            message: "Error creating invoice",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


// @desc Get all invoices of logged-in user
// @route GET /api/invoices
// @access Private
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id })
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        
        console.log(`✅ Fetched ${invoices.length} invoices for user ${req.user.id}`);
        
        res.json(invoices);
    } catch (error) {
        console.error('❌ Error fetching invoices:', error);
        res.status(500).json({
            message: "Error fetching invoices",
            error: error.message
        });
    }
};

// @desc Get single invoice by ID
// @route GET /api/invoices/:id
// @access Private
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate("user", "name email");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found or access denied"
            });
        }

        console.log('✅ Invoice fetched:', invoice._id);
        console.log('📦 billFrom data:', invoice.billFrom);

        res.json(invoice);
    } catch (error) {
        console.error('❌ Error fetching invoice:', error);
        res.status(500).json({
            message: "Error fetching invoice",
            error: error.message
        });
    }
};

// @desc Update invoice
// @route PUT /api/invoices/:id
// @access Private
exports.updateInvoice = async (req, res) => {
    try {
        // Check authorization first
        const existingInvoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!existingInvoice) {
            return res.status(404).json({
                message: "Invoice not found or access denied"
            });
        }

        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
            status,
        } = req.body;

        console.log('🔄 Updating invoice with items:', items);

        // Recalculate totals if items exist
        let subtotal = 0;
        let taxTotal = 0;
        
        if (items && Array.isArray(items) && items.length > 0) {
            items.forEach((item) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const taxPercent = Number(item.taxPercent) || 0;
                
                const itemSubtotal = quantity * unitPrice;
                const itemTax = itemSubtotal * (taxPercent / 100);
                
                subtotal += itemSubtotal;
                taxTotal += itemTax;
            });
        }
        
        const total = subtotal + taxTotal;

        console.log('💰 Recalculated:', { subtotal, taxTotal, total });

        // Check if values are valid numbers
        if (isNaN(subtotal) || !isFinite(subtotal)) subtotal = 0;
        if (isNaN(taxTotal) || !isFinite(taxTotal)) taxTotal = 0;
        if (isNaN(total) || !isFinite(total)) total = 0;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            {
                invoiceNumber,
                invoiceDate,
                dueDate,
                billFrom,
                billTo,
                items,
                notes,
                paymentTerms,
                status,
                subtotal,
                taxTotal,
                total,
            },
            { new: true, runValidators: true }
        );

        console.log('✅ Invoice updated successfully:', updatedInvoice._id);

        res.json(updatedInvoice);
    } catch (error) {
        console.error('❌ Error updating invoice:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            message: "Error updating invoice",
            error: error.message
        });
    }
};

// @desc Delete Invoice
// @route DELETE /api/invoices/:id
// @access Private
exports.deleteInvoice = async (req, res) => {
    try {
        console.log('🔍 DELETE request received for invoice ID:', req.params.id);
        console.log('👤 User ID:', req.user?.id);

        const invoiceId = req.params.id;

        // Check if invoice exists and belongs to user
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            user: req.user.id
        });

        if (!invoice) {
            console.log('❌ Invoice not found or access denied');
            return res.status(404).json({
                message: "Invoice not found or you don't have permission to delete it"
            });
        }

        // Delete the invoice
        await Invoice.findByIdAndDelete(invoiceId);
        console.log('✅ Invoice deleted successfully');

        res.json({
            message: "Invoice deleted successfully",
            deletedInvoice: invoiceId
        });

    } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        res.status(500).json({
            message: "Error deleting invoice",
            error: error.message
        });
    }
};

// @desc Update invoice status only
// @route PUT /api/invoices/:id/status
// @access Private
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Paid', 'Unpaid', 'Overdue', 'Pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be one of: " + validStatuses.join(', ')
            });
        }

        // Check authorization
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found or access denied"
            });
        }

        // Update status
        invoice.status = status;
        await invoice.save();

        console.log('✅ Invoice status updated:', invoice._id, 'to', status);

        res.json(invoice);
    } catch (error) {
        console.error('❌ Error updating invoice status:', error);
        res.status(500).json({
            message: "Error updating invoice status",
            error: error.message
        });
    }
};
