const express = require("express");
const { body } = require("express-validator");
const masterElemenController = require("../controllers/masterElemenController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("pilarId").notEmpty().withMessage("Pilar ID is required"),
  body("nama")
    .notEmpty()
    .withMessage("Nama is required")
    .isLength({ max: 255 })
    .withMessage("Nama must be at most 255 characters"),
  body("deskripsi")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Deskripsi must be at most 1000 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

const updateValidation = [
  body("pilarId").optional().notEmpty().withMessage("Pilar ID cannot be empty"),
  body("nama")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Nama must be at most 255 characters"),
  body("deskripsi")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Deskripsi must be at most 1000 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// Routes
router.get("/", masterElemenController.getAll);
router.get("/:id", masterElemenController.getById);
router.post("/", createValidation, masterElemenController.create);
router.put("/:id", updateValidation, masterElemenController.update);
router.delete("/:id", masterElemenController.delete);

module.exports = router;
