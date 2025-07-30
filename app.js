require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import middleware
const errorHandler = require("./src/middleware/errorHandler");

// Import routes
const masterKlausulRoutes = require("./src/routes/masterKlausulRoutes");
const masterPilarRoutes = require("./src/routes/masterPilarRoutes");
const masterElemenRoutes = require("./src/routes/masterElemenRoutes");
const masterSubElemenRoutes = require("./src/routes/masterSubElemenRoutes");
const pengukuranMasterRoutes = require("./src/routes/pengukuranMasterRoutes");
const pelaksanaanSemesterRoutes = require("./src/routes/pelaksanaanSemesterRoutes");
const dataImportRoutes = require("./src/routes/dataImportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SDM Dashboard API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/master-klausul", masterKlausulRoutes);
app.use("/api/master-pilar", masterPilarRoutes);
app.use("/api/master-elemen", masterElemenRoutes);
app.use("/api/master-sub-elemen", masterSubElemenRoutes);
app.use("/api/pengukuran-master", pengukuranMasterRoutes);
app.use("/api/pelaksanaan-semester", pelaksanaanSemesterRoutes);
app.use("/api/import", dataImportRoutes);

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "SDM Dashboard API",
    version: "1.0.0",
    endpoints: {
      "GET /health": "Health check",
      "GET /api": "API documentation",
      "Master Klausul": {
        "GET /api/master-klausul": "Get all klausul with complete hierarchy",
        "GET /api/master-klausul?semester=S1": "Filter by semester (S1/S2)",
        "GET /api/master-klausul?tahun=2024": "Filter by year",
        "GET /api/master-klausul?semester=S1&tahun=2024":
          "Filter by semester and year",
        "GET /api/master-klausul/:id": "Get klausul by ID with full hierarchy",
        "GET /api/master-klausul/:id?semester=S1":
          "Get klausul by ID filtered by semester",
        "GET /api/master-klausul/:id/stats":
          "Get klausul with statistics and complete hierarchy",
        "GET /api/master-klausul/:id/stats?semester=S1&tahun=2024":
          "Get statistics filtered by semester and year",
        "POST /api/master-klausul": "Create new klausul",
        "PUT /api/master-klausul/:id": "Update klausul",
        "DELETE /api/master-klausul/:id": "Delete klausul",
      },
      "Master Pilar": {
        "GET /api/master-pilar": "Get all pilar",
        "GET /api/master-pilar/:id": "Get pilar by ID",
        "POST /api/master-pilar": "Create new pilar",
        "PUT /api/master-pilar/:id": "Update pilar",
        "DELETE /api/master-pilar/:id": "Delete pilar",
      },
      "Master Elemen": {
        "GET /api/master-elemen": "Get all elemen",
        "GET /api/master-elemen/:id": "Get elemen by ID",
        "POST /api/master-elemen": "Create new elemen",
        "PUT /api/master-elemen/:id": "Update elemen",
        "DELETE /api/master-elemen/:id": "Delete elemen",
      },
      "Master Sub Elemen": {
        "GET /api/master-sub-elemen": "Get all sub elemen",
        "GET /api/master-sub-elemen/:id": "Get sub elemen by ID",
        "POST /api/master-sub-elemen": "Create new sub elemen",
        "PUT /api/master-sub-elemen/:id": "Update sub elemen",
        "DELETE /api/master-sub-elemen/:id": "Delete sub elemen",
      },
      "Pengukuran Master": {
        "GET /api/pengukuran-master": "Get all pengukuran",
        "GET /api/pengukuran-master/:id": "Get pengukuran by ID",
        "GET /api/pengukuran-master/:id/execution-summary":
          "Get pengukuran with execution summary",
        "POST /api/pengukuran-master": "Create new pengukuran",
        "PUT /api/pengukuran-master/:id": "Update pengukuran",
        "DELETE /api/pengukuran-master/:id": "Delete pengukuran",
      },
      "Data Import": {
        "GET /api/import/template": "Get import template and instructions",
        "POST /api/import/validate": "Validate import data without importing",
        "POST /api/import/json": "Import data from JSON payload",
        "POST /api/import/file": "Import data from uploaded JSON file",
      },
      "Pelaksanaan Semester": {
        "GET /api/pelaksanaan-semester": "Get all pelaksanaan semester",
        "GET /api/pelaksanaan-semester/dashboard-stats":
          "Get dashboard statistics",
        "GET /api/pelaksanaan-semester/:id": "Get pelaksanaan by ID",
        "POST /api/pelaksanaan-semester": "Create new pelaksanaan",
        "PUT /api/pelaksanaan-semester/:id": "Update pelaksanaan",
        "PATCH /api/pelaksanaan-semester/:id/status": "Update status",
        "PATCH /api/pelaksanaan-semester/:id/progress": "Update progress",
        "DELETE /api/pelaksanaan-semester/:id": "Delete pelaksanaan",
      },
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SDM Dashboard API is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

module.exports = app;
