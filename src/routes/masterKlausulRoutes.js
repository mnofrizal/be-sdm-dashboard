const express = require("express");
const { body } = require("express-validator");
const masterKlausulController = require("../controllers/masterKlausulController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("kode")
    .notEmpty()
    .withMessage("Kode is required")
    .isLength({ max: 10 })
    .withMessage("Kode must be at most 10 characters"),
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
  body("kode")
    .optional()
    .isLength({ max: 10 })
    .withMessage("Kode must be at most 10 characters"),
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
router.get("/", masterKlausulController.getAll);
router.get("/:id", masterKlausulController.getById);
router.get("/:id/stats", masterKlausulController.getWithStats);
router.post("/", createValidation, masterKlausulController.create);
router.put("/:id", updateValidation, masterKlausulController.update);
router.delete("/:id", masterKlausulController.delete);

module.exports = router;
