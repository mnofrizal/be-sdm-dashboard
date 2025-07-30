const express = require("express");
const { body } = require("express-validator");
const {
  dataImportController,
  uploadMiddleware,
} = require("../controllers/dataImportController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules for JSON import
const jsonImportValidation = [
  body("data")
    .isArray()
    .withMessage("Data must be an array")
    .notEmpty()
    .withMessage("Data array cannot be empty"),
  body("data.*.klausulSmap")
    .notEmpty()
    .withMessage("klausulSmap is required for each item"),
  body("data.*.pilar")
    .notEmpty()
    .withMessage("pilar is required for each item"),
  body("data.*.elemen")
    .notEmpty()
    .withMessage("elemen is required for each item"),
  body("data.*.subElemen")
    .notEmpty()
    .withMessage("subElemen is required for each item"),
  body("data.*.pengukuran")
    .notEmpty()
    .withMessage("pengukuran is required for each item"),
  body("data.*.jadwalPengerjaan")
    .notEmpty()
    .withMessage("jadwalPengerjaan is required for each item"),
  body("data.*.kualitasPemenuhan")
    .notEmpty()
    .withMessage("kualitasPemenuhan is required for each item"),
  body("data.*.indikator")
    .notEmpty()
    .withMessage("indikator is required for each item"),
  body("data.*.evidence")
    .notEmpty()
    .withMessage("evidence is required for each item"),
  body("data.*.pic").notEmpty().withMessage("pic is required for each item"),
  body("options.defaultYear")
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage("defaultYear must be between 2020 and 2050"),
  body("createdBy")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("createdBy must be between 1 and 100 characters"),
  handleValidationErrors,
];

// Validation rules for data validation
const validateDataValidation = [
  body("data")
    .isArray()
    .withMessage("Data must be an array")
    .notEmpty()
    .withMessage("Data array cannot be empty"),
  handleValidationErrors,
];

// Routes
router.get("/template", dataImportController.getImportTemplate);
router.post(
  "/validate",
  validateDataValidation,
  dataImportController.validateImportData
);
router.post("/json", jsonImportValidation, dataImportController.importFromJson);
router.post("/file", uploadMiddleware, dataImportController.importFromFile);

module.exports = router;
