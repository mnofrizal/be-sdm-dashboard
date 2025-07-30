const express = require("express");
const { body } = require("express-validator");
const pengukuranMasterController = require("../controllers/pengukuranMasterController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("subElemenId").notEmpty().withMessage("Sub Elemen ID is required"),
  body("namaPengukuran")
    .notEmpty()
    .withMessage("Nama Pengukuran is required")
    .isLength({ max: 255 })
    .withMessage("Nama Pengukuran must be at most 255 characters"),
  body("jadwalPengerjaan")
    .notEmpty()
    .withMessage("Jadwal Pengerjaan is required"),
  body("kualitasPemenuhan")
    .notEmpty()
    .withMessage("Kualitas Pemenuhan is required"),
  body("indikator").notEmpty().withMessage("Indikator is required"),
  body("evidence").notEmpty().withMessage("Evidence is required"),
  body("pic").notEmpty().withMessage("PIC is required"),
  body("linkEvidence")
    .optional()
    .isURL()
    .withMessage("Link Evidence must be a valid URL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

const updateValidation = [
  body("subElemenId")
    .optional()
    .notEmpty()
    .withMessage("Sub Elemen ID cannot be empty"),
  body("namaPengukuran")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Nama Pengukuran must be at most 255 characters"),
  body("linkEvidence")
    .optional()
    .isURL()
    .withMessage("Link Evidence must be a valid URL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// Routes
router.get("/", pengukuranMasterController.getAll);
router.get("/:id", pengukuranMasterController.getById);
router.get(
  "/:id/execution-summary",
  pengukuranMasterController.getWithExecutionSummary
);
router.post("/", createValidation, pengukuranMasterController.create);
router.put("/:id", updateValidation, pengukuranMasterController.update);
router.delete("/:id", pengukuranMasterController.delete);

module.exports = router;
