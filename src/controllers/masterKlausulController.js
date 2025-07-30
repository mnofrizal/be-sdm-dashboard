const prisma = require("../utils/database");

const masterKlausulController = {
  // Get all klausul
  getAll: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        semester,
        tahun,
      } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { kode: { contains: search, mode: "insensitive" } },
          { nama: { contains: search, mode: "insensitive" } },
        ];
      }
      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      const [klausul, total] = await Promise.all([
        prisma.masterKlausul.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            pilar: {
              where: { isActive: true },
              include: {
                elemen: {
                  where: { isActive: true },
                  include: {
                    subElemen: {
                      where: { isActive: true },
                      include: {
                        pengukuran: {
                          where: { isActive: true },
                          include: {
                            pelaksanaanSemester: {
                              orderBy: [{ tahun: "desc" }, { semester: "asc" }],
                              take: 10, // Limit to recent 10 pelaksanaan per pengukuran
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.masterKlausul.count({ where }),
      ]);

      res.json({
        success: true,
        data: klausul,
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

  // Get klausul by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { semester, tahun } = req.query;
      const klausul = await prisma.masterKlausul.findUnique({
        where: { id },
        include: {
          pilar: {
            include: {
              elemen: {
                include: {
                  subElemen: {
                    include: {
                      pengukuran: {
                        include: {
                          pelaksanaanSemester: {
                            include: {
                              historyLog: {
                                orderBy: { createdAt: "desc" },
                                take: 5, // Latest 5 history logs per pelaksanaan
                              },
                            },
                            orderBy: [{ tahun: "desc" }, { semester: "asc" }],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!klausul) {
        return res.status(404).json({
          success: false,
          message: "Klausul not found",
        });
      }

      res.json({
        success: true,
        data: klausul,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new klausul
  create: async (req, res, next) => {
    try {
      const { kode, nama, deskripsi, isActive = true } = req.body;

      const klausul = await prisma.masterKlausul.create({
        data: {
          kode,
          nama,
          deskripsi,
          isActive,
        },
      });

      res.status(201).json({
        success: true,
        message: "Klausul created successfully",
        data: klausul,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update klausul
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { kode, nama, deskripsi, isActive } = req.body;

      const klausul = await prisma.masterKlausul.update({
        where: { id },
        data: {
          kode,
          nama,
          deskripsi,
          isActive,
        },
      });

      res.json({
        success: true,
        message: "Klausul updated successfully",
        data: klausul,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete klausul
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.masterKlausul.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Klausul deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // Get klausul with complete hierarchy and statistics
  getWithStats: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tahun } = req.query;

      const klausul = await prisma.masterKlausul.findUnique({
        where: { id },
        include: {
          pilar: {
            include: {
              elemen: {
                include: {
                  subElemen: {
                    include: {
                      pengukuran: {
                        include: {
                          pelaksanaanSemester: {
                            where: tahun ? { tahun: parseInt(tahun) } : {},
                            include: {
                              historyLog: {
                                orderBy: { createdAt: "desc" },
                                take: 3,
                              },
                            },
                            orderBy: [{ tahun: "desc" }, { semester: "asc" }],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!klausul) {
        return res.status(404).json({
          success: false,
          message: "Klausul not found",
        });
      }

      // Calculate statistics
      let totalPengukuran = 0;
      let totalPelaksanaan = 0;
      const statusCount = {
        PLANNED: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        COMPLETED: 0,
        OVERDUE: 0,
        CANCELLED: 0,
        ON_HOLD: 0,
      };
      let totalProgress = 0;

      klausul.pilar.forEach((pilar) => {
        pilar.elemen.forEach((elemen) => {
          elemen.subElemen.forEach((subElemen) => {
            totalPengukuran += subElemen.pengukuran.length;
            subElemen.pengukuran.forEach((pengukuran) => {
              totalPelaksanaan += pengukuran.pelaksanaanSemester.length;
              pengukuran.pelaksanaanSemester.forEach((pelaksanaan) => {
                statusCount[pelaksanaan.status]++;
                totalProgress += pelaksanaan.progress;
              });
            });
          });
        });
      });

      const averageProgress =
        totalPelaksanaan > 0 ? Math.round(totalProgress / totalPelaksanaan) : 0;

      res.json({
        success: true,
        data: {
          ...klausul,
          statistics: {
            totalPilar: klausul.pilar.length,
            totalElemen: klausul.pilar.reduce(
              (sum, p) => sum + p.elemen.length,
              0
            ),
            totalSubElemen: klausul.pilar.reduce(
              (sum, p) =>
                sum +
                p.elemen.reduce((sum2, e) => sum2 + e.subElemen.length, 0),
              0
            ),
            totalPengukuran,
            totalPelaksanaan,
            statusDistribution: statusCount,
            averageProgress,
            completionRate:
              totalPelaksanaan > 0
                ? Math.round((statusCount.COMPLETED / totalPelaksanaan) * 100)
                : 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = masterKlausulController;
