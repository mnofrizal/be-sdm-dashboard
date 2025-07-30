# SDM Dashboard Backend - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the `.env` file and configure your database:

```bash
# Update the DATABASE_URL with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/sdm_dashboard?schema=public"
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
```

### 4. Seed Sample Data

```bash
# Seed the database with sample-data.json
npm run db:seed
```

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

---

## 📊 Seeding Data

### Method 1: Using the Seed Script (Recommended)

```bash
npm run db:seed
```

This will automatically import all data from `sample-data.json` into your database.

### Method 2: Using the API Endpoint

Start the server and use the import API:

```bash
# Start the server
npm run dev

# Then use the API endpoint
curl -X POST http://localhost:3000/api/import/json \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

### Method 3: Using REST Client

1. Start the server: `npm run dev`
2. Open `test.rest` file
3. Use the "Import data from JSON" request

---

## 🗂️ Sample Data Structure

The `sample-data.json` contains the following structure:

```json
[
  {
    "id": "38",
    "klausulSmap": "8.1 - Perencanaan dan pengendalian operasi\n9.1 - Pemantauan, pengukuran, analisis dan evaluasi",
    "pilar": "Pendeteksian",
    "elemen": "Monitoring",
    "subElemen": "Fraud dan Compliance Risk Assessment",
    "pengukuran": "Pemenuhan Pemantauan Compliance Risk Assessment",
    "jadwalPengerjaan": "Dilakukan setiap Triwulan",
    "semester1": "10/04/2024",
    "semester2": "",
    "kualitasPemenuhan": "Kualitas",
    "indikator": "Pemantauan monitoring dan evaluasi CRA",
    "evidence": "Monev efektivitas CRA",
    "linkEvidence": "https://example.com/evidence",
    "pic": "Tim SDM",
    "status": "PLANNED"
  }
]
```

---

## 🔄 Database Reset & Reseed

If you need to reset your database and reseed:

```bash
# This will reset the database and run the seed script
npm run db:reset
```

**⚠️ Warning**: This will delete all existing data!

---

## 📋 What Gets Created During Seeding

The seed script will create the complete hierarchy:

1. **MasterKlausul** - Extracted from `klausulSmap` field
2. **MasterPilar** - From `pilar` field
3. **MasterElemen** - From `elemen` field
4. **MasterSubElemen** - From `subElemen` field
5. **PengukuranMaster** - From `pengukuran` and related fields
6. **PelaksanaanSemester** - From `semester1` and `semester2` dates
7. **HistoryLog** - Automatic logging for pelaksanaan records

---

## 🧪 Testing the Seeded Data

After seeding, you can test the API:

### Check if data was imported

```bash
# Get all klausul
curl http://localhost:3000/api/master-klausul

# Get all pelaksanaan semester
curl http://localhost:3000/api/pelaksanaan-semester

# Get dashboard statistics
curl http://localhost:3000/api/pelaksanaan-semester/dashboard-stats
```

### Using the REST client

Open `test.rest` and run any of the GET requests to verify the data.

---

## 🔧 Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Verify database credentials and database exists

### Seeding Fails

- Check if `sample-data.json` exists in the root directory
- Ensure the JSON format is valid
- Check database connection
- Look at the error logs for specific issues

### Import Validation Errors

Use the validation endpoint to check your data:

```bash
curl -X POST http://localhost:3000/api/import/validate \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

---

## 📚 Additional Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database without seeding
npx prisma migrate reset --force
```

---

## 🌐 API Documentation

Once the server is running, visit:

- API Documentation: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`

For detailed API testing, use the `test.rest` file with a REST client like the VS Code REST Client extension.
