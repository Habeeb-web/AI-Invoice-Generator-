const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  billFrom: {
    businessName: String,
    email: String,
    address: String,
    phone: String
  },
  billTo: {
    clientName: String,
    email: String,
    address: String,
    phone: String
  },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    taxPercent: Number,
    total: Number
  }],
  subtotal: Number,
  taxTotal: Number,
  total: Number,
  notes: String,
  paymentTerms: String,
  status: {
    type: String,
    default: 'Unpaid'
  }
}, {
  timestamps: true
});

// THIS IS THE CRITICAL LINE - Make sure it's exactly like this
module.exports = mongoose.model('Invoice', invoiceSchema);
