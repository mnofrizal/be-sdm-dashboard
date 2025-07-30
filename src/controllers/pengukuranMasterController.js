const prisma = require("../utils/database");

const pengukuranMasterController = {
  // Get all pengukuran
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, isActive, subElemenId } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { namaPengukuran: { contains: search, mode: "insensitive" } },
          { pic: { contains: search, mode: "insensitive" } },
          { indikator: { contains: search, mode: "insensitive" } },
        ];
      }
      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }
      if (subElemenId) {
        where.subElemenId = subElemenId;
      }

      const [pengukuran, total] = await Promise.all([
        prisma.pengukuranMaster.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            subElemen: {
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
            },
            pelaksanaanSemester: {
              select: {
                id: true,
                semester: true,
                tahun: true,
                status: true,
                progress: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.pengukuranMaster.count({ where }),
      ]);

      res.json({
        success: true,
        data: pengukuran,
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

  // Get pengukuran by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pengukuran = await prisma.pengukuranMaster.findUnique({
        where: { id },
        include: {
          subElemen: {
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
            },
          },
          pelaksanaanSemester: {
            include: {
              historyLog: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
            },
          },
        },
      });

      if (!pengukuran) {
        return res.status(404).json({
          success: false,
          message: "Pengukuran not found",
        });
      }

      res.json({
        success: true,
        data: pengukuran,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new pengukuran
  create: async (req, res, next) => {
    try {
      const {
        subElemenId,
        namaPengukuran,
        jadwalPengerjaan,
        kualitasPemenuhan,
        indikator,
        evidence,
        linkEvidence,
        pic,
        isActive = true,
        createdBy,
      } = req.body;

      const pengukuran = await prisma.pengukuranMaster.create({
        data: {
          subElemenId,
          namaPengukuran,
          jadwalPengerjaan,
          kualitasPemenuhan,
          indikator,
          evidence,
          linkEvidence,
          pic,
          isActive,
          createdBy,
        },
        include: {
          subElemen: {
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
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Pengukuran created successfully",
        data: pengukuran,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update pengukuran
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        subElemenId,
        namaPengukuran,
        jadwalPengerjaan,
        kualitasPemenuhan,
        indikator,
        evidence,
        linkEvidence,
        pic,
        isActive,
        updatedBy,
      } = req.body;

      const pengukuran = await prisma.pengukuranMaster.update({
        where: { id },
        data: {
          subElemenId,
          namaPengukuran,
          jadwalPengerjaan,
          kualitasPemenuhan,
          indikator,
          evidence,
          linkEvidence,
          pic,
          isActive,
          updatedBy,
        },
        include: {
          subElemen: {
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
          },
        },
      });

      res.json({
        success: true,
        message: "Pengukuran updated successfully",
        data: pengukuran,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete pengukuran
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.pengukuranMaster.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Pengukuran deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // Get pengukuran with execution summary
  getWithExecutionSummary: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tahun } = req.query;

      const where = { pengukuranId: id };
      if (tahun) {
        where.tahun = parseInt(tahun);
      }

      const pengukuran = await prisma.pengukuranMaster.findUnique({
        where: { id },
        include: {
          subElemen: {
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
            },
          },
          pelaksanaanSemester: {
            where,
            orderBy: [{ tahun: "desc" }, { semester: "asc" }],
          },
        },
      });

      if (!pengukuran) {
        return res.status(404).json({
          success: false,
          message: "Pengukuran not found",
        });
      }

      // Calculate execution summary
      const executionSummary = {
        totalExecution: pengukuran.pelaksanaanSemester.length,
        completed: pengukuran.pelaksanaanSemester.filter(
          (p) => p.status === "COMPLETED"
        ).length,
        inProgress: pengukuran.pelaksanaanSemester.filter(
          (p) => p.status === "IN_PROGRESS"
        ).length,
        planned: pengukuran.pelaksanaanSemester.filter(
          (p) => p.status === "PLANNED"
        ).length,
        overdue: pengukuran.pelaksanaanSemester.filter(
          (p) => p.status === "OVERDUE"
        ).length,
        averageProgress:
          pengukuran.pelaksanaanSemester.length > 0
            ? Math.round(
                pengukuran.pelaksanaanSemester.reduce(
                  (sum, p) => sum + p.progress,
                  0
                ) / pengukuran.pelaksanaanSemester.length
              )
            : 0,
      };

      res.json({
        success: true,
        data: {
          ...pengukuran,
          executionSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = pengukuranMasterController;
