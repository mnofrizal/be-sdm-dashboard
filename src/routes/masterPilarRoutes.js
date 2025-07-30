const express = require("express");
const { body } = require("express-validator");
const masterPilarController = require("../controllers/masterPilarController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createValidation = [
  body("klausulId").notEmpty().withMessage("Klausul ID is required"),
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
  body("klausulId")
    .optional()
    .notEmpty()
    .withMessage("Klausul ID cannot be empty"),
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
router.get("/", masterPilarController.getAll);
router.get("/:id", masterPilarController.getById);
router.post("/", createValidation, masterPilarController.create);
router.put("/:id", updateValidation, masterPilarController.update);
router.delete("/:id", masterPilarController.delete);

module.exports = router;
