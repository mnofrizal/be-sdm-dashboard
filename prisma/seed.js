const { PrismaClient } = require("@prisma/client");
const DataImporter = require("../src/utils/dataImporter");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create default user first
    console.log("👤 Creating default user...");
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "sdm@msdm.app" }
    });

    if (!existingUser) {
      // Hash the password
      const hashedPassword = await bcrypt.hash("1234", 12);
      
      // Create the user
      await prisma.user.create({
        data: {
          email: "sdm@msdm.app",
          name: "SDM Admin",
          password: hashedPassword,
          role: "ADMIN",
          isActive: true
        }
      });
      
      console.log("✅ Default user created: sdm@msdm.app (password: 1234)");
    } else {
      console.log("👤 Default user already exists");
    }
    // Read the sample data file
    const sampleDataPath = path.join(__dirname, "..", "sample-data.json");

    if (!fs.existsSync(sampleDataPath)) {
      console.error("❌ sample-data.json file not found!");
      console.log(
        "Please make sure sample-data.json exists in the root directory"
      );
      process.exit(1);
    }

    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, "utf8"));
    console.log(`📄 Found ${sampleData.length} records to import`);

    // Create data importer instance
    const importer = new DataImporter();

    // Import the data
    const results = await importer.importData(sampleData, {
      createdBy: "seed-script",
      defaultYear: 2024,
      logProgress: true,
    });

    // Display results
    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📊 Import Summary:");
    console.log(`   Total Records Processed: ${sampleData.length}`);
    console.log(
      `   Klausul Created: ${results.created.klausul}, Updated: ${results.updated.klausul}`
    );
    console.log(
      `   Pilar Created: ${results.created.pilar}, Updated: ${results.updated.pilar}`
    );
    console.log(
      `   Elemen Created: ${results.created.elemen}, Updated: ${results.updated.elemen}`
    );
    console.log(
      `   Sub Elemen Created: ${results.created.subElemen}, Updated: ${results.updated.subElemen}`
    );
    console.log(
      `   Pengukuran Created: ${results.created.pengukuran}, Updated: ${results.updated.pengukuran}`
    );
    console.log(
      `   Pelaksanaan Created: ${results.created.pelaksanaan}, Updated: ${results.updated.pelaksanaan}`
    );

    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Item ${error.itemIndex}: ${error.error}`);
      });
    }

    console.log("\n🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
