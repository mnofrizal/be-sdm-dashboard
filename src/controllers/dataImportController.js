const DataImporter = require("../utils/dataImporter");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "import-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const dataImportController = {
  // Import data from JSON payload
  importFromJson: async (req, res, next) => {
    try {
      const { data, options = {} } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: "Invalid data format. Expected array of objects.",
        });
      }

      const importer = new DataImporter();
      const results = await importer.importData(data, {
        createdBy: req.body.createdBy || "api-user",
        defaultYear: options.defaultYear || new Date().getFullYear(),
        logProgress: options.logProgress !== false,
      });

      res.json({
        success: true,
        message: "Data import completed",
        results: {
          summary: {
            totalProcessed: data.length,
            totalCreated: Object.values(results.created).reduce(
              (sum, count) => sum + count,
              0
            ),
            totalUpdated: Object.values(results.updated).reduce(
              (sum, count) => sum + count,
              0
            ),
            totalErrors: results.errors.length,
          },
          details: {
            created: results.created,
            updated: results.updated,
            errors: results.errors,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Import data from uploaded JSON file
  importFromFile: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const options = {
        createdBy: req.body.createdBy || "file-upload-user",
        defaultYear: parseInt(req.body.defaultYear) || new Date().getFullYear(),
        logProgress: req.body.logProgress !== "false",
      };

      const importer = new DataImporter();
      const results = await importer.importFromFile(req.file.path, options);

      // Clean up uploaded file
      const fs = require("fs");
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn("Failed to cleanup uploaded file:", cleanupError);
      }

      res.json({
        success: true,
        message: "File import completed",
        results: {
          summary: {
            totalCreated: Object.values(results.created).reduce(
              (sum, count) => sum + count,
              0
            ),
            totalUpdated: Object.values(results.updated).reduce(
              (sum, count) => sum + count,
              0
            ),
            totalErrors: results.errors.length,
          },
          details: {
            created: results.created,
            updated: results.updated,
            errors: results.errors,
          },
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        const fs = require("fs");
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn("Failed to cleanup uploaded file:", cleanupError);
        }
      }
      next(error);
    }
  },

  // Get import template/example
  getImportTemplate: async (req, res, next) => {
    try {
      const template = [
        {
          id: "1",
          klausulSmap:
            "8.1 - Perencanaan dan pengendalian operasi\n9.1 - Pemantauan, pengukuran, analisis dan evaluasi",
          pilar: "Pendeteksian",
          elemen: "Monitoring",
          subElemen: "Fraud dan Compliance Risk Assessment",
          pengukuran: "Pemenuhan Pemantauan Compliance Risk Assessment",
          jadwalPengerjaan: "Dilakukan setiap Triwulan",
          semester1: "10/04/2024",
          semester2: "",
          kualitasPemenuhan: "Kualitas",
          indikator: "Pemantauan monitoring dan evaluasi CRA",
          evidence: "Monev efektivitas CRA",
          linkEvidence: "https://example.com/evidence",
          pic: "Tim SDM",
          status: "PLANNED",
          updatedAt: "",
        },
      ];

      res.json({
        success: true,
        message: "Import template",
        data: template,
        instructions: {
          "Required fields": [
            "klausulSmap - Contains klausul codes and names (e.g., '8.1 - Name\\n9.1 - Name')",
            "pilar - Pilar name",
            "elemen - Elemen name",
            "subElemen - Sub elemen name",
            "pengukuran - Pengukuran name",
            "jadwalPengerjaan - Schedule description",
            "kualitasPemenuhan - Quality fulfillment",
            "indikator - Indicator description",
            "evidence - Evidence description",
            "pic - Person in charge",
          ],
          "Optional fields": [
            "id - External ID for reference",
            "semester1 - Target date for semester 1 (DD/MM/YYYY)",
            "semester2 - Target date for semester 2 (DD/MM/YYYY)",
            "linkEvidence - URL to evidence",
            "status - Status (PLANNED, IN_PROGRESS, etc.)",
            "updatedAt - Last update timestamp",
          ],
          "Import options": [
            "createdBy - User who performs the import",
            "defaultYear - Year for pelaksanaan semester (default: current year)",
            "logProgress - Show progress logs (default: true)",
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Validate import data without importing
  validateImportData: async (req, res, next) => {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: "Invalid data format. Expected array of objects.",
        });
      }

      const validationResults = {
        valid: [],
        invalid: [],
        warnings: [],
      };

      const requiredFields = [
        "klausulSmap",
        "pilar",
        "elemen",
        "subElemen",
        "pengukuran",
        "jadwalPengerjaan",
        "kualitasPemenuhan",
        "indikator",
        "evidence",
        "pic",
      ];

      data.forEach((item, index) => {
        const itemValidation = {
          index: index + 1,
          id: item.id,
          errors: [],
          warnings: [],
        };

        // Check required fields
        requiredFields.forEach((field) => {
          if (!item[field] || item[field].toString().trim() === "") {
            itemValidation.errors.push(`Missing required field: ${field}`);
          }
        });

        // Check klausul format
        if (item.klausulSmap && !item.klausulSmap.match(/\d+\.\d+/)) {
          itemValidation.errors.push(
            'klausulSmap should contain klausul codes (e.g., "8.1")'
          );
        }

        // Check semester dates format
        if (item.semester1 && !item.semester1.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          itemValidation.warnings.push(
            "semester1 should be in DD/MM/YYYY format"
          );
        }
        if (item.semester2 && !item.semester2.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          itemValidation.warnings.push(
            "semester2 should be in DD/MM/YYYY format"
          );
        }

        // Check status
        const validStatuses = [
          "PLANNED",
          "IN_PROGRESS",
          "REVIEW",
          "COMPLETED",
          "OVERDUE",
          "CANCELLED",
          "ON_HOLD",
        ];
        if (item.status && !validStatuses.includes(item.status)) {
          itemValidation.warnings.push(
            `Invalid status: ${item.status}. Valid values: ${validStatuses.join(
              ", "
            )}`
          );
        }

        // Check URL format
        if (item.linkEvidence && item.linkEvidence.trim() !== "") {
          try {
            new URL(item.linkEvidence);
          } catch {
            itemValidation.warnings.push("linkEvidence should be a valid URL");
          }
        }

        if (itemValidation.errors.length === 0) {
          validationResults.valid.push(itemValidation);
        } else {
          validationResults.invalid.push(itemValidation);
        }

        if (itemValidation.warnings.length > 0) {
          validationResults.warnings.push(itemValidation);
        }
      });

      res.json({
        success: true,
        message: "Validation completed",
        results: {
          summary: {
            total: data.length,
            valid: validationResults.valid.length,
            invalid: validationResults.invalid.length,
            withWarnings: validationResults.warnings.length,
          },
          details: validationResults,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

// Export both controller and upload middleware
module.exports = {
  dataImportController,
  uploadMiddleware: upload.single("file"),
};
