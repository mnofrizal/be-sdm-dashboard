const prisma = require("./database");

class DataImporter {
  constructor() {
    this.importedData = {
      klausul: new Map(),
      pilar: new Map(),
      elemen: new Map(),
      subElemen: new Map(),
      pengukuran: new Map(),
      pelaksanaan: new Map(),
    };
  }

  // Parse klausul codes from klausulSmap string
  parseKlausulCodes(klausulSmap) {
    const codes = [];
    // Match patterns like "4.5", "7.2.1", "7.2.2.2", "8.2", etc.
    const matches = klausulSmap.match(/\d+(?:\.\d+)*/g);
    if (matches) {
      codes.push(...matches);
    }
    return [...new Set(codes)]; // Remove duplicates
  }

  // Extract klausul name from klausulSmap
  extractKlausulName(klausulSmap, kode) {
    const parts = klausulSmap.split("\n");
    for (const part of parts) {
      if (part.includes(kode)) {
        return part.replace(`${kode} - `, "").trim();
      }
    }
    return `Klausul ${kode}`;
  }

  // Create unique key for caching
  createKey(parentId, nama) {
    return `${parentId}_${nama.toLowerCase().trim()}`;
  }

  async importData(jsonData, options = {}) {
    const {
      createdBy = "system",
      defaultYear = new Date().getFullYear(),
      logProgress = true,
    } = options;

    const results = {
      created: {
        klausul: 0,
        pilar: 0,
        elemen: 0,
        subElemen: 0,
        pengukuran: 0,
        pelaksanaan: 0,
      },
      updated: {
        klausul: 0,
        pilar: 0,
        elemen: 0,
        subElemen: 0,
        pengukuran: 0,
        pelaksanaan: 0,
      },
      errors: [],
    };

    try {
      for (let i = 0; i < jsonData.length; i++) {
        const item = jsonData[i];

        if (logProgress) {
          console.log(
            `Processing item ${i + 1}/${jsonData.length}: ${item.pengukuran}`
          );
        }

        try {
          // Skip items with invalid or empty data
          if (
            !item.klausulSmap ||
            !item.pilar ||
            !item.elemen ||
            !item.subElemen ||
            !item.pengukuran
          ) {
            if (logProgress) {
              console.log(`Skipping item ${i + 1}: Missing required fields`);
            }
            continue;
          }

          // 1. Process Klausul(s)
          const klausulCodes = this.parseKlausulCodes(item.klausulSmap);
          let klausulId = null;

          // Skip if no valid klausul codes found
          if (klausulCodes.length === 0) {
            if (logProgress) {
              console.log(
                `Skipping item ${i + 1}: No valid klausul codes found in "${
                  item.klausulSmap
                }"`
              );
            }
            continue;
          }

          for (const kode of klausulCodes) {
            const klausulNama = this.extractKlausulName(item.klausulSmap, kode);
            const klausulKey = kode;

            if (!this.importedData.klausul.has(klausulKey)) {
              const klausul = await prisma.masterKlausul.upsert({
                where: { kode },
                update: {
                  nama: klausulNama,
                  deskripsi: item.klausulSmap,
                  updatedAt: new Date(),
                },
                create: {
                  kode,
                  nama: klausulNama,
                  deskripsi: item.klausulSmap,
                  isActive: true,
                },
              });

              this.importedData.klausul.set(klausulKey, klausul.id);
              if (klausul.createdAt === klausul.updatedAt) {
                results.created.klausul++;
              } else {
                results.updated.klausul++;
              }
            }

            // Use the first klausul as primary
            if (!klausulId) {
              klausulId = this.importedData.klausul.get(klausulKey);
            }
          }

          // Ensure we have a valid klausulId before proceeding
          if (!klausulId) {
            if (logProgress) {
              console.log(
                `Skipping item ${i + 1}: Could not determine klausulId`
              );
            }
            continue;
          }

          // 2. Process Pilar
          const pilarKey = this.createKey(klausulId, item.pilar);
          let pilarId;

          if (!this.importedData.pilar.has(pilarKey)) {
            const pilar = await prisma.masterPilar.upsert({
              where: {
                klausulId_nama: {
                  klausulId,
                  nama: item.pilar,
                },
              },
              update: {
                deskripsi: `Pilar ${item.pilar}`,
                updatedAt: new Date(),
              },
              create: {
                klausulId,
                nama: item.pilar,
                deskripsi: `Pilar ${item.pilar}`,
                isActive: true,
              },
            });

            this.importedData.pilar.set(pilarKey, pilar.id);
            pilarId = pilar.id;

            if (pilar.createdAt === pilar.updatedAt) {
              results.created.pilar++;
            } else {
              results.updated.pilar++;
            }
          } else {
            pilarId = this.importedData.pilar.get(pilarKey);
          }

          // 3. Process Elemen
          const elemenKey = this.createKey(pilarId, item.elemen);
          let elemenId;

          if (!this.importedData.elemen.has(elemenKey)) {
            const elemen = await prisma.masterElemen.upsert({
              where: {
                pilarId_nama: {
                  pilarId,
                  nama: item.elemen,
                },
              },
              update: {
                deskripsi: `Elemen ${item.elemen}`,
                updatedAt: new Date(),
              },
              create: {
                pilarId,
                nama: item.elemen,
                deskripsi: `Elemen ${item.elemen}`,
                isActive: true,
              },
            });

            this.importedData.elemen.set(elemenKey, elemen.id);
            elemenId = elemen.id;

            if (elemen.createdAt === elemen.updatedAt) {
              results.created.elemen++;
            } else {
              results.updated.elemen++;
            }
          } else {
            elemenId = this.importedData.elemen.get(elemenKey);
          }

          // 4. Process SubElemen
          const subElemenKey = this.createKey(elemenId, item.subElemen);
          let subElemenId;

          if (!this.importedData.subElemen.has(subElemenKey)) {
            const subElemen = await prisma.masterSubElemen.upsert({
              where: {
                elemenId_nama: {
                  elemenId,
                  nama: item.subElemen,
                },
              },
              update: {
                deskripsi: `Sub Elemen ${item.subElemen}`,
                updatedAt: new Date(),
              },
              create: {
                elemenId,
                nama: item.subElemen,
                deskripsi: `Sub Elemen ${item.subElemen}`,
                isActive: true,
              },
            });

            this.importedData.subElemen.set(subElemenKey, subElemen.id);
            subElemenId = subElemen.id;

            if (subElemen.createdAt === subElemen.updatedAt) {
              results.created.subElemen++;
            } else {
              results.updated.subElemen++;
            }
          } else {
            subElemenId = this.importedData.subElemen.get(subElemenKey);
          }

          // 5. Process PengukuranMaster
          const pengukuranKey = this.createKey(
            subElemenId,
            `${item.pengukuran}_${item.indikator}`
          );
          let pengukuranId;

          if (!this.importedData.pengukuran.has(pengukuranKey)) {
            const pengukuran = await prisma.pengukuranMaster.upsert({
              where: {
                subElemenId_namaPengukuran_indikator: {
                  subElemenId,
                  namaPengukuran: item.pengukuran,
                  indikator: item.indikator,
                },
              },
              update: {
                jadwalPengerjaan: item.jadwalPengerjaan,
                kualitasPemenuhan: item.kualitasPemenuhan,
                indikator: item.indikator,
                evidence: item.evidence,
                linkEvidence: item.linkEvidence,
                pic: item.pic,
                updatedAt: new Date(),
                updatedBy: createdBy,
              },
              create: {
                subElemenId,
                namaPengukuran: item.pengukuran,
                jadwalPengerjaan: item.jadwalPengerjaan,
                kualitasPemenuhan: item.kualitasPemenuhan,
                indikator: item.indikator,
                evidence: item.evidence,
                linkEvidence: item.linkEvidence,
                pic: item.pic,
                isActive: true,
                createdBy: createdBy,
              },
            });

            this.importedData.pengukuran.set(pengukuranKey, pengukuran.id);
            pengukuranId = pengukuran.id;

            if (pengukuran.createdAt === pengukuran.updatedAt) {
              results.created.pengukuran++;
            } else {
              results.updated.pengukuran++;
            }
          } else {
            pengukuranId = this.importedData.pengukuran.get(pengukuranKey);
          }

          // 6. Process PelaksanaanSemester
          const semesters = [];
          if (item.semester1 && item.semester1.trim() !== "") {
            semesters.push({ semester: "S1", tanggalTarget: item.semester1 });
          }
          if (item.semester2 && item.semester2.trim() !== "") {
            semesters.push({ semester: "S2", tanggalTarget: item.semester2 });
          }

          for (const semesterData of semesters) {
            const pelaksanaanKey = `${pengukuranId}_${semesterData.semester}_${defaultYear}`;

            if (!this.importedData.pelaksanaan.has(pelaksanaanKey)) {
              const pelaksanaan = await prisma.pelaksanaanSemester.upsert({
                where: {
                  pengukuranId_semester_tahun: {
                    pengukuranId,
                    semester: semesterData.semester,
                    tahun: defaultYear,
                  },
                },
                update: {
                  tanggalTarget: semesterData.tanggalTarget,
                  status: item.status || "PLANNED",
                  picPelaksana: item.pic,
                  updatedAt: new Date(),
                  updatedBy: createdBy,
                },
                create: {
                  pengukuranId,
                  semester: semesterData.semester,
                  tahun: defaultYear,
                  tanggalTarget: semesterData.tanggalTarget,
                  status: item.status || "PLANNED",
                  progress: 0,
                  picPelaksana: item.pic,
                  createdBy: createdBy,
                },
              });

              this.importedData.pelaksanaan.set(pelaksanaanKey, pelaksanaan.id);

              if (pelaksanaan.createdAt === pelaksanaan.updatedAt) {
                results.created.pelaksanaan++;
              } else {
                results.updated.pelaksanaan++;
              }

              // Create history log for new pelaksanaan
              if (pelaksanaan.createdAt === pelaksanaan.updatedAt) {
                await prisma.historyLog.create({
                  data: {
                    pelaksanaanSemesterId: pelaksanaan.id,
                    action: "IMPORT_CREATE",
                    newValue: JSON.stringify(pelaksanaan),
                    description: `Imported from JSON data - Item ID: ${item.id}`,
                    createdBy: createdBy,
                  },
                });
              }
            }
          }
        } catch (itemError) {
          console.error(`Error processing item ${i + 1}:`, itemError);
          results.errors.push({
            itemIndex: i + 1,
            itemId: item.id,
            error: itemError.message,
            item: item,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  }

  // Helper method to import from file
  async importFromFile(filePath, options = {}) {
    const fs = require("fs");
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return await this.importData(jsonData, options);
  }

  // Clear cache (useful for multiple imports)
  clearCache() {
    this.importedData = {
      klausul: new Map(),
      pilar: new Map(),
      elemen: new Map(),
      subElemen: new Map(),
      pengukuran: new Map(),
      pelaksanaan: new Map(),
    };
  }
}

module.exports = DataImporter;
