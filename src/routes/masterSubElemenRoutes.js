const express = require("express");
const { body } = require("express-validator");
const masterSubElemenController = require("../controllers/masterSubElemenController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("elemenId").notEmpty().withMessage("Elemen ID is required"),
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
  body("elemenId")
    .optional()
    .notEmpty()
    .withMessage("Elemen ID cannot be empty"),
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
router.get("/", masterSubElemenController.getAll);
router.get("/:id", masterSubElemenController.getById);
router.post("/", createValidation, masterSubElemenController.create);
router.put("/:id", updateValidation, masterSubElemenController.update);
router.delete("/:id", masterSubElemenController.delete);

module.exports = router;
