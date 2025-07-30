const prisma = require("../utils/database");

const masterSubElemenController = {
  // Get all sub elemen
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, isActive, elemenId } = req.query;
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
      if (elemenId) {
        where.elemenId = elemenId;
      }

      const [subElemen, total] = await Promise.all([
        prisma.masterSubElemen.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            elemen: {
              include: {
                pilar: {
                  include: {
                    klausul: {
                      select: { id: true, kode: true, nama: true },
                    },
                  },
                },
              },
            },
            pengukuran: {
              where: { isActive: true },
              select: { id: true, namaPengukuran: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.masterSubElemen.count({ where }),
      ]);

      res.json({
        success: true,
        data: subElemen,
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

  // Get sub elemen by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const subElemen = await prisma.masterSubElemen.findUnique({
        where: { id },
        include: {
          elemen: {
            include: {
              pilar: {
                include: {
                  klausul: true,
                },
              },
            },
          },
          pengukuran: {
            include: {
              pelaksanaanSemester: true,
            },
          },
        },
      });

      if (!subElemen) {
        return res.status(404).json({
          success: false,
          message: "Sub Elemen not found",
        });
      }

      res.json({
        success: true,
        data: subElemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new sub elemen
  create: async (req, res, next) => {
    try {
      const { elemenId, nama, deskripsi, isActive = true } = req.body;

      const subElemen = await prisma.masterSubElemen.create({
        data: {
          elemenId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          elemen: {
            include: {
              pilar: {
                include: {
                  klausul: {
                    select: { id: true, kode: true, nama: true },
                  },
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Sub Elemen created successfully",
        data: subElemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update sub elemen
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { elemenId, nama, deskripsi, isActive } = req.body;

      const subElemen = await prisma.masterSubElemen.update({
        where: { id },
        data: {
          elemenId,
          nama,
          deskripsi,
          isActive,
        },
        include: {
          elemen: {
            include: {
              pilar: {
                include: {
                  klausul: {
                    select: { id: true, kode: true, nama: true },
                  },
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Sub Elemen updated successfully",
        data: subElemen,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete sub elemen
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.masterSubElemen.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Sub Elemen deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = masterSubElemenController;
