const express = require("express");
const { body } = require("express-validator");
const pelaksanaanSemesterController = require("../controllers/pelaksanaanSemesterController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("pengukuranId").notEmpty().withMessage("Pengukuran ID is required"),
  body("semester").isIn(["S1", "S2"]).withMessage("Semester must be S1 or S2"),
  body("tahun")
    .isInt({ min: 2020, max: 2050 })
    .withMessage("Tahun must be between 2020 and 2050"),
  body("tanggalTarget").notEmpty().withMessage("Tanggal target is required"),
  body("picPelaksana").notEmpty().withMessage("PIC Pelaksana is required"),
  body("status")
    .optional()
    .isIn([
      "PLANNED",
      "IN_PROGRESS",
      "REVIEW",
      "COMPLETED",
      "OVERDUE",
      "CANCELLED",
      "ON_HOLD",
    ])
    .withMessage("Invalid status"),
  body("progress")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
  handleValidationErrors,
];

const updateValidation = [
  body("pengukuranId")
    .optional()
    .notEmpty()
    .withMessage("Pengukuran ID cannot be empty"),
  body("semester")
    .optional()
    .isIn(["S1", "S2"])
    .withMessage("Semester must be S1 or S2"),
  body("tahun")
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage("Tahun must be between 2020 and 2050"),
  body("status")
    .optional()
    .isIn([
      "PLANNED",
      "IN_PROGRESS",
      "REVIEW",
      "COMPLETED",
      "OVERDUE",
      "CANCELLED",
      "ON_HOLD",
    ])
    .withMessage("Invalid status"),
  body("progress")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
  handleValidationErrors,
];

const statusValidation = [
  body("status")
    .isIn([
      "PLANNED",
      "IN_PROGRESS",
      "REVIEW",
      "COMPLETED",
      "OVERDUE",
      "CANCELLED",
      "ON_HOLD",
    ])
    .withMessage("Invalid status"),
  body("updatedBy").notEmpty().withMessage("Updated by is required"),
  handleValidationErrors,
];

const progressValidation = [
  body("progress")
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
  body("updatedBy").notEmpty().withMessage("Updated by is required"),
  handleValidationErrors,
];

// Routes
router.get("/", pelaksanaanSemesterController.getAll);
router.get("/dashboard-stats", pelaksanaanSemesterController.getDashboardStats);
router.get("/:id", pelaksanaanSemesterController.getById);
router.post("/", createValidation, pelaksanaanSemesterController.create);
router.put("/:id", updateValidation, pelaksanaanSemesterController.update);
router.patch(
  "/:id/status",
  statusValidation,
  pelaksanaanSemesterController.updateStatus
);
router.patch(
  "/:id/progress",
  progressValidation,
  pelaksanaanSemesterController.updateProgress
);
router.delete("/:id", pelaksanaanSemesterController.delete);

module.exports = router;
