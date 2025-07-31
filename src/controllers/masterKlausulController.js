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

      // Build semester/tahun filter for pelaksanaanSemester
      const pelaksanaanFilter = {};
      if (semester) pelaksanaanFilter.semester = semester;
      if (tahun) pelaksanaanFilter.tahun = parseInt(tahun);

      let klausul, total;

      if (semester || tahun) {
        // If filtering by semester/tahun, we need to only return klausul that have matching pelaksanaanSemester
        const klausulWithPelaksanaan = await prisma.masterKlausul.findMany({
          where: {
            ...where,
            pilar: {
              some: {
                isActive: true,
                elemen: {
                  some: {
                    isActive: true,
                    subElemen: {
                      some: {
                        isActive: true,
                        pengukuran: {
                          some: {
                            isActive: true,
                            pelaksanaanSemester: {
                              some: pelaksanaanFilter,
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
                              where: pelaksanaanFilter,
                              orderBy: [{ tahun: "desc" }, { semester: "asc" }],
                              take: 10,
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
        });

        const totalWithPelaksanaan = await prisma.masterKlausul.count({
          where: {
            ...where,
            pilar: {
              some: {
                isActive: true,
                elemen: {
                  some: {
                    isActive: true,
                    subElemen: {
                      some: {
                        isActive: true,
                        pengukuran: {
                          some: {
                            isActive: true,
                            pelaksanaanSemester: {
                              some: pelaksanaanFilter,
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

        klausul = klausulWithPelaksanaan;
        total = totalWithPelaksanaan;
      } else {
        // No semester/tahun filter, return all klausul
        const [allKlausul, allTotal] = await Promise.all([
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
                                orderBy: [
                                  { tahun: "desc" },
                                  { semester: "asc" },
                                ],
                                take: 10,
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

        klausul = allKlausul;
        total = allTotal;
      }

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
      // Build filter for pelaksanaanSemester
      const pelaksanaanFilter = {};
      if (semester) pelaksanaanFilter.semester = semester;
      if (tahun) pelaksanaanFilter.tahun = parseInt(tahun);

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
                            where: pelaksanaanFilter,
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
      const { tahun, semester } = req.query;

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
                            where: {
                              ...(tahun && { tahun: parseInt(tahun) }),
                              ...(semester && { semester: semester }),
                            },
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

  // Get klausul grouped by semester
  getBySemesterGroup: async (req, res, next) => {
    try {
      const { tahun, search, isActive } = req.query;

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

      // Get all klausul with complete hierarchy
      const allKlausul = await prisma.masterKlausul.findMany({
        where,
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
                            where: tahun ? { tahun: parseInt(tahun) } : {},
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
        orderBy: { createdAt: "desc" },
      });

      // Group data by semester
      const semesterGroups = {
        S1: {
          semester: "S1",
          klausul: [],
          statistics: {
            totalKlausul: 0,
            totalPengukuran: 0,
            totalPelaksanaan: 0,
            statusDistribution: {
              PLANNED: 0,
              IN_PROGRESS: 0,
              REVIEW: 0,
              COMPLETED: 0,
              OVERDUE: 0,
              CANCELLED: 0,
              ON_HOLD: 0,
            },
            averageProgress: 0,
          },
        },
        S2: {
          semester: "S2",
          klausul: [],
          statistics: {
            totalKlausul: 0,
            totalPengukuran: 0,
            totalPelaksanaan: 0,
            statusDistribution: {
              PLANNED: 0,
              IN_PROGRESS: 0,
              REVIEW: 0,
              COMPLETED: 0,
              OVERDUE: 0,
              CANCELLED: 0,
              ON_HOLD: 0,
            },
            averageProgress: 0,
          },
        },
      };

      // Process each klausul and group by semester
      allKlausul.forEach((klausul) => {
        const klausulForS1 = JSON.parse(JSON.stringify(klausul)); // Deep clone
        const klausulForS2 = JSON.parse(JSON.stringify(klausul)); // Deep clone

        let hasS1Data = false;
        let hasS2Data = false;

        // Filter and collect S1 data
        klausulForS1.pilar = klausulForS1.pilar.map((pilar) => ({
          ...pilar,
          elemen: pilar.elemen.map((elemen) => ({
            ...elemen,
            subElemen: elemen.subElemen.map((subElemen) => ({
              ...subElemen,
              pengukuran: subElemen.pengukuran.map((pengukuran) => {
                const s1Pelaksanaan = pengukuran.pelaksanaanSemester.filter(
                  (p) => p.semester === "S1"
                );
                if (s1Pelaksanaan.length > 0) {
                  hasS1Data = true;
                  // Update S1 statistics
                  semesterGroups.S1.statistics.totalPengukuran++;
                  semesterGroups.S1.statistics.totalPelaksanaan +=
                    s1Pelaksanaan.length;
                  s1Pelaksanaan.forEach((pelaksanaan) => {
                    semesterGroups.S1.statistics.statusDistribution[
                      pelaksanaan.status
                    ]++;
                  });
                }
                return {
                  ...pengukuran,
                  pelaksanaanSemester: s1Pelaksanaan,
                };
              }),
            })),
          })),
        }));

        // Filter and collect S2 data
        klausulForS2.pilar = klausulForS2.pilar.map((pilar) => ({
          ...pilar,
          elemen: pilar.elemen.map((elemen) => ({
            ...elemen,
            subElemen: elemen.subElemen.map((subElemen) => ({
              ...subElemen,
              pengukuran: subElemen.pengukuran.map((pengukuran) => {
                const s2Pelaksanaan = pengukuran.pelaksanaanSemester.filter(
                  (p) => p.semester === "S2"
                );
                if (s2Pelaksanaan.length > 0) {
                  hasS2Data = true;
                  // Update S2 statistics
                  semesterGroups.S2.statistics.totalPengukuran++;
                  semesterGroups.S2.statistics.totalPelaksanaan +=
                    s2Pelaksanaan.length;
                  s2Pelaksanaan.forEach((pelaksanaan) => {
                    semesterGroups.S2.statistics.statusDistribution[
                      pelaksanaan.status
                    ]++;
                  });
                }
                return {
                  ...pengukuran,
                  pelaksanaanSemester: s2Pelaksanaan,
                };
              }),
            })),
          })),
        }));

        // Add klausul to appropriate semester groups
        if (hasS1Data) {
          semesterGroups.S1.klausul.push(klausulForS1);
          semesterGroups.S1.statistics.totalKlausul++;
        }

        if (hasS2Data) {
          semesterGroups.S2.klausul.push(klausulForS2);
          semesterGroups.S2.statistics.totalKlausul++;
        }
      });

      // Calculate average progress for each semester
      ["S1", "S2"].forEach((semester) => {
        const group = semesterGroups[semester];
        let totalProgress = 0;
        let pelaksanaanCount = 0;

        group.klausul.forEach((klausul) => {
          klausul.pilar.forEach((pilar) => {
            pilar.elemen.forEach((elemen) => {
              elemen.subElemen.forEach((subElemen) => {
                subElemen.pengukuran.forEach((pengukuran) => {
                  pengukuran.pelaksanaanSemester.forEach((pelaksanaan) => {
                    totalProgress += pelaksanaan.progress;
                    pelaksanaanCount++;
                  });
                });
              });
            });
          });
        });

        group.statistics.averageProgress =
          pelaksanaanCount > 0
            ? Math.round(totalProgress / pelaksanaanCount)
            : 0;
      });

      res.json({
        success: true,
        data: {
          semester1: semesterGroups.S1,
          semester2: semesterGroups.S2,
          summary: {
            totalKlausulS1: semesterGroups.S1.statistics.totalKlausul,
            totalKlausulS2: semesterGroups.S2.statistics.totalKlausul,
            totalPengukuranS1: semesterGroups.S1.statistics.totalPengukuran,
            totalPengukuranS2: semesterGroups.S2.statistics.totalPengukuran,
            totalPelaksanaanS1: semesterGroups.S1.statistics.totalPelaksanaan,
            totalPelaksanaanS2: semesterGroups.S2.statistics.totalPelaksanaan,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = masterKlausulController;
