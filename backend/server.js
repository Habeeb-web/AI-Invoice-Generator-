require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes=require('./routes/invoiceRoutes')
const aiRoutes = require('./routes/aiRoutes')


const app = express();

// Middleware to handle CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);


// Connect Database
connectDB();

// Body parser middleware - MUST come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// API Routes - Define ALL routes BEFORE 404 handler
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);
// 404 handler - MUST be the LAST route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));