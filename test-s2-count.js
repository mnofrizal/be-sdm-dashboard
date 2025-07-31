const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function testS2Count() {
  try {
    console.log("=== TESTING S2 SEMESTER COUNT ===\n");

    // Read the sample data to compare
    const sampleData = JSON.parse(fs.readFileSync("sample-data.json", "utf8"));

    // Count total S2 records in database
    const totalS2Count = await prisma.pelaksanaanSemester.count({
      where: { semester: "S2" },
    });

    console.log(`Total S2 records in database: ${totalS2Count}`);

    // Get all S2 records with their pengukuran details
    const s2Records = await prisma.pelaksanaanSemester.findMany({
      where: { semester: "S2" },
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
      orderBy: { id: "asc" },
    });

    console.log(`\nDetailed S2 records (${s2Records.length}):`);

    s2Records.forEach((record, index) => {
      const pengukuran = record.pengukuran;
      console.log(`${index + 1}. Pengukuran: "${pengukuran.namaPengukuran}"`);
      console.log(
        `   Klausul: ${pengukuran.subElemen.elemen.pilar.klausul.kode}`
      );
      console.log(`   Target Date: ${record.tanggalTarget}`);
      console.log(`   Year: ${record.tahun}`);
      console.log("");
    });

    // Now let's check which sample data records should have created S2
    console.log("=== ANALYZING SAMPLE DATA FOR S2 ===\n");

    let expectedS2Count = 0;
    const recordsWithS2 = [];

    sampleData.forEach((item, index) => {
      if (item.semester2 && item.semester2.trim() !== "") {
        expectedS2Count++;
        recordsWithS2.push({
          id: item.id,
          pengukuran: item.pengukuran,
          semester2: item.semester2,
          klausul: item.klausulSmap.split(" - ")[0],
        });
      }
    });

    console.log(`Expected S2 records from sample data: ${expectedS2Count}`);
    console.log(`Actual S2 records in database: ${totalS2Count}`);
    console.log(`Match: ${expectedS2Count === totalS2Count ? "✅" : "❌"}`);

    if (recordsWithS2.length > 0) {
      console.log("\nRecords that should create S2:");
      recordsWithS2.forEach((record, index) => {
        console.log(`${index + 1}. ID ${record.id}: ${record.pengukuran}`);
        console.log(`   Klausul: ${record.klausul}`);
        console.log(`   Semester2: "${record.semester2}"`);
        console.log("");
      });
    } else {
      console.log(
        "\nNo records in sample data have non-empty semester2 values."
      );
    }

    // Check for any discrepancies
    if (expectedS2Count !== totalS2Count) {
      console.log("\n⚠️  DISCREPANCY DETECTED!");
      console.log(`Expected: ${expectedS2Count}, Actual: ${totalS2Count}`);
      console.log(
        "This suggests there might be an issue with the data importer logic."
      );
    } else {
      console.log(
        "\n✅ S2 count matches expectations - data importer is working correctly."
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testS2Count();
