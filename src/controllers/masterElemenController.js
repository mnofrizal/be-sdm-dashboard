const prisma = require("../utils/database");

const masterElemenController = {
  // Get all elemen
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, isActive, pilarId } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { nama: { contains: search, mode: "insensitive" } },
          { deskripsi: { contains: search, mode: "insensitive" } },
        ];
      }
      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }
      if (pilarId) {
        where.pilarId = pilarId;
      }

      const [elemen, total] = await Promise.all([
        prisma.masterElemen.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            pilar: {
              include: {
                klausul: {
                  select: { id: true, kode: true, nama: true },
                },
              },
            },
            subElemen: {
              where: { isActive: true },
              select: { id: true, nama: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.masterElemen.count({ where }),
      ]);

      res.json({
        success: true,
        data: elemen,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get elemen by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const elemen = await prisma.masterElemen.findUnique({
        where: { id },
        include: {
          pilar: {
            include: {
              klausul: true,
            },
          },
          subElemen: {
            include: {
              pengukuran: true,
            },
          },
        },
      });

      if (!elemen) {
        return res.status(404).json({
          success: false,
          message: "Elemen not found",
        });
      }

      res.json({
        success: true,
        data: elemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new elemen
  create: async (req, res, next) => {
    try {
      const { pilarId, nama, deskripsi, isActive = true } = req.body;

      const elemen = await prisma.masterElemen.create({
        data: {
          pilarId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          pilar: {
            include: {
              klausul: {
                select: { id: true, kode: true, nama: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Elemen created successfully",
        data: elemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update elemen
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { pilarId, nama, deskripsi, isActive } = req.body;

      const elemen = await prisma.masterElemen.update({
        where: { id },
        data: {
          pilarId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          pilar: {
            include: {
              klausul: {
                select: { id: true, kode: true, nama: true },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Elemen updated successfully",
        data: elemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete elemen
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.masterElemen.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Elemen deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = masterElemenController;
