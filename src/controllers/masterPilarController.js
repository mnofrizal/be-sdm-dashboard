const prisma = require("../utils/database");

const masterPilarController = {
  // Get all pilar
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, isActive, klausulId } = req.query;
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
      if (klausulId) {
        where.klausulId = klausulId;
      }

      const [pilar, total] = await Promise.all([
        prisma.masterPilar.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            klausul: {
              select: { id: true, kode: true, nama: true },
            },
            elemen: {
              where: { isActive: true },
              select: { id: true, nama: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.masterPilar.count({ where }),
      ]);

      res.json({
        success: true,
        data: pilar,
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

  // Get pilar by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pilar = await prisma.masterPilar.findUnique({
        where: { id },
        include: {
          klausul: true,
          elemen: {
            include: {
              subElemen: {
                include: {
                  pengukuran: true,
                },
              },
            },
          },
        },
      });

      if (!pilar) {
        return res.status(404).json({
          success: false,
          message: "Pilar not found",
        });
      }

      res.json({
        success: true,
        data: pilar,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new pilar
  create: async (req, res, next) => {
    try {
      const { klausulId, nama, deskripsi, isActive = true } = req.body;

      const pilar = await prisma.masterPilar.create({
        data: {
          klausulId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          klausul: {
            select: { id: true, kode: true, nama: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Pilar created successfully",
        data: pilar,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update pilar
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { klausulId, nama, deskripsi, isActive } = req.body;

      const pilar = await prisma.masterPilar.update({
        where: { id },
        data: {
          klausulId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          klausul: {
            select: { id: true, kode: true, nama: true },
          },
        },
      });

      res.json({
        success: true,
        message: "Pilar updated successfully",
        data: pilar,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete pilar
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.masterPilar.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Pilar deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = masterPilarController;
