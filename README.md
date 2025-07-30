# SDM Dashboard Backend API

Backend API for SDM Dashboard built with Express.js and Prisma ORM.

## Features

- RESTful API with Express.js
- PostgreSQL database with Prisma ORM
- Hierarchical data structure (Klausul → Pilar → Elemen → SubElemen → Pengukuran → Pelaksanaan)
- CRUD operations for all entities
- Input validation with express-validator
- Error handling middleware
- CORS support
- File upload support
- History logging for pelaksanaan semester
- Dashboard statistics

## Project Structure

```
be-sdm-dashboard/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── masterKlausulController.js
│   │   ├── masterPilarController.js
│   │   └── pelaksanaanSemesterController.js
│   ├── routes/               # API routes
│   │   ├── masterKlausulRoutes.js
│   │   ├── masterPilarRoutes.js
│   │   └── pelaksanaanSemesterRoutes.js
│   ├── middleware/           # Custom middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   └── utils/               # Utilities
│       └── database.js      # Prisma client
├── app.js                   # Main application file
├── package.json
└── .env                     # Environment variables
```

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure your database connection:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/sdm_dashboard?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

4. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

5. Push database schema (for development):

   ```bash
   npm run db:push
   ```

   Or run migrations (for production):

   ```bash
   npm run db:migrate
   ```

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### API Documentation

- `GET /api` - API documentation with all available endpoints

### Master Klausul

- `GET /api/master-klausul` - Get all klausul (with pagination, search, filter)
- `GET /api/master-klausul/:id` - Get klausul by ID
- `POST /api/master-klausul` - Create new klausul
- `PUT /api/master-klausul/:id` - Update klausul
- `DELETE /api/master-klausul/:id` - Delete klausul

### Master Pilar

- `GET /api/master-pilar` - Get all pilar (with pagination, search, filter)
- `GET /api/master-pilar/:id` - Get pilar by ID
- `POST /api/master-pilar` - Create new pilar
- `PUT /api/master-pilar/:id` - Update pilar
- `DELETE /api/master-pilar/:id` - Delete pilar

### Pelaksanaan Semester

- `GET /api/pelaksanaan-semester` - Get all pelaksanaan semester
- `GET /api/pelaksanaan-semester/dashboard-stats` - Get dashboard statistics
- `GET /api/pelaksanaan-semester/:id` - Get pelaksanaan by ID
- `POST /api/pelaksanaan-semester` - Create new pelaksanaan
- `PUT /api/pelaksanaan-semester/:id` - Update pelaksanaan
- `PATCH /api/pelaksanaan-semester/:id/status` - Update status only
- `PATCH /api/pelaksanaan-semester/:id/progress` - Update progress only
- `DELETE /api/pelaksanaan-semester/:id` - Delete pelaksanaan

## Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Search & Filter

- `search` - Search term
- `isActive` - Filter by active status (true/false)
- `klausulId` - Filter by klausul ID (for pilar)
- `status` - Filter by status (for pelaksanaan)
- `semester` - Filter by semester (S1/S2)
- `tahun` - Filter by year

## Request/Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // For validation errors
}
```

## Database Schema

The application uses a hierarchical structure:

1. **MasterKlausul** - Top level (e.g., "9.4", "8.1")
2. **MasterPilar** - Belongs to Klausul (e.g., "Pendeteksian", "Pencegahan")
3. **MasterElemen** - Belongs to Pilar (e.g., "Pelaporan", "Monitoring")
4. **MasterSubElemen** - Belongs to Elemen (e.g., "Tinjauan Tim Kepatuhan")
5. **PengukuranMaster** - Belongs to SubElemen (measurement definitions)
6. **PelaksanaanSemester** - Belongs to PengukuranMaster (execution records)
7. **HistoryLog** - Tracks changes to PelaksanaanSemester
8. **User** - User management (optional)
9. **FileAttachment** - File attachments (optional)

## Development

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Create routes in `src/routes/`
3. Add routes to `app.js`
4. Add validation rules as needed

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT secret for authentication (if implemented)
- `FRONTEND_URL` - Frontend URL for CORS
- `MAX_FILE_SIZE` - Maximum file upload size
- `UPLOAD_PATH` - File upload directory

## License

MIT License
