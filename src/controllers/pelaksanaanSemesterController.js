const prisma = require("../utils/database");

const pelaksanaanSemesterController = {
  // Get all pelaksanaan semester
  getAll: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        semester,
        tahun,
        pengukuranId,
      } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { picPelaksana: { contains: search, mode: "insensitive" } },
          { catatan: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) {
        where.status = status;
      }
      if (semester) {
        where.semester = semester;
      }
      if (tahun) {
        where.tahun = parseInt(tahun);
      }
      if (pengukuranId) {
        where.pengukuranId = pengukuranId;
      }

      const [pelaksanaan, total] = await Promise.all([
        prisma.pelaksanaanSemester.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            pengukuran: {
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
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.pelaksanaanSemester.count({ where }),
      ]);

      res.json({
        success: true,
        data: pelaksanaan,
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

  // Get pelaksanaan by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const pelaksanaan = await prisma.pelaksanaanSemester.findUnique({
        where: { id },
        include: {
          pengukuran: {
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
            },
          },
          historyLog: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!pelaksanaan) {
        return res.status(404).json({
          success: false,
          message: "Pelaksanaan semester not found",
        });
      }

      res.json({
        success: true,
        data: pelaksanaan,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new pelaksanaan semester
  create: async (req, res, next) => {
    try {
      const {
        pengukuranId,
        semester,
        tahun,
        tanggalTarget,
        tanggalMulai,
        tanggalSelesai,
        status = "PLANNED",
        progress = 0,
        catatan,
        evidenceActual,
        linkEvidenceActual,
        picPelaksana,
        createdBy,
      } = req.body;

      const pelaksanaan = await prisma.pelaksanaanSemester.create({
        data: {
          pengukuranId,
          semester,
          tahun,
          tanggalTarget,
          tanggalMulai,
          tanggalSelesai,
          status,
          progress,
          catatan,
          evidenceActual,
          linkEvidenceActual,
          picPelaksana,
          createdBy,
        },
        include: {
          pengukuran: {
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
            },
          },
        },
      });

      // Create history log
      await prisma.historyLog.create({
        data: {
          pelaksanaanSemesterId: pelaksanaan.id,
          action: "CREATE",
          newValue: JSON.stringify(pelaksanaan),
          description: "Pelaksanaan semester created",
          createdBy,
        },
      });

      res.status(201).json({
        success: true,
        message: "Pelaksanaan semester created successfully",
        data: pelaksanaan,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update pelaksanaan semester
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        pengukuranId,
        semester,
        tahun,
        tanggalTarget,
        tanggalMulai,
        tanggalSelesai,
        status,
        progress,
        catatan,
        evidenceActual,
        linkEvidenceActual,
        picPelaksana,
        updatedBy,
      } = req.body;

      // Get old data for history
      const oldData = await prisma.pelaksanaanSemester.findUnique({
        where: { id },
      });

      const pelaksanaan = await prisma.pelaksanaanSemester.update({
        where: { id },
        data: {
          pengukuranId,
          semester,
          tahun,
          tanggalTarget,
          tanggalMulai,
          tanggalSelesai,
          status,
          progress,
          catatan,
          evidenceActual,
          linkEvidenceActual,
          picPelaksana,
          updatedBy,
        },
        include: {
          pengukuran: {
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
            },
          },
        },
      });

      // Create history log
      await prisma.historyLog.create({
        data: {
          pelaksanaanSemesterId: pelaksanaan.id,
          action: "UPDATE",
          oldValue: JSON.stringify(oldData),
          newValue: JSON.stringify(pelaksanaan),
          description: "Pelaksanaan semester updated",
          createdBy: updatedBy,
        },
      });

      res.json({
        success: true,
        message: "Pelaksanaan semester updated successfully",
        data: pelaksanaan,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, updatedBy } = req.body;

      const oldData = await prisma.pelaksanaanSemester.findUnique({
        where: { id },
      });

      const pelaksanaan = await prisma.pelaksanaanSemester.update({
        where: { id },
        data: { status, updatedBy },
      });

      // Create history log
      await prisma.historyLog.create({
        data: {
          pelaksanaanSemesterId: pelaksanaan.id,
          action: "UPDATE_STATUS",
          oldValue: oldData.status,
          newValue: status,
          description: `Status changed from ${oldData.status} to ${status}`,
          createdBy: updatedBy,
        },
      });

      res.json({
        success: true,
        message: "Status updated successfully",
        data: pelaksanaan,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update progress
  updateProgress: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { progress, updatedBy } = req.body;

      const oldData = await prisma.pelaksanaanSemester.findUnique({
        where: { id },
      });

      const pelaksanaan = await prisma.pelaksanaanSemester.update({
        where: { id },
        data: { progress, updatedBy },
      });

      // Create history log
      await prisma.historyLog.create({
        data: {
          pelaksanaanSemesterId: pelaksanaan.id,
          action: "UPDATE_PROGRESS",
          oldValue: oldData.progress.toString(),
          newValue: progress.toString(),
          description: `Progress updated from ${oldData.progress}% to ${progress}%`,
          createdBy: updatedBy,
        },
      });

      res.json({
        success: true,
        message: "Progress updated successfully",
        data: pelaksanaan,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete pelaksanaan semester
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.pelaksanaanSemester.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Pelaksanaan semester deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (req, res, next) => {
    try {
      const { tahun, semester } = req.query;

      const where = {};
      if (tahun) where.tahun = parseInt(tahun);
      if (semester) where.semester = semester;

      const stats = await prisma.pelaksanaanSemester.groupBy({
        by: ["status"],
        where,
        _count: {
          status: true,
        },
      });

      const avgProgress = await prisma.pelaksanaanSemester.aggregate({
        where,
        _avg: {
          progress: true,
        },
      });

      res.json({
        success: true,
        data: {
          statusDistribution: stats,
          averageProgress: avgProgress._avg.progress || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = pelaksanaanSemesterController;
