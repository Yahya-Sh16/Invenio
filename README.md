# Invenio Master - Enterprise Inventory Management System

A modern, full-stack inventory management system built with Next.js, Node.js, Prisma, and PostgreSQL. Features secure authentication, role-based authorization, and a comprehensive dashboard for managing inventory, sales, purchases, and expenses.

## 🚀 Features

### Authentication & Authorization
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Role-based authorization (Admin, Manager, Staff, Viewer)
- ✅ Secure password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Protected routes and middleware

### Inventory Management
- ✅ Product CRUD operations with validation
- ✅ Stock quantity tracking
- ✅ Product search and filtering
- ✅ Pagination support
- ✅ Low stock alerts

### Dashboard & Analytics
- ✅ Real-time dashboard metrics
- ✅ Sales, purchase, and expense summaries
- ✅ Popular products tracking
- ✅ Revenue and profit calculations
- ✅ Responsive charts and visualizations

### User Interface
- ✅ Modern, responsive design with TailwindCSS
- ✅ Dark/light mode toggle
- ✅ Material-UI components
- ✅ Data grids with sorting and filtering
- ✅ Toast notifications
- ✅ Loading states and error handling

### Security & Performance
- ✅ Input validation with Zod
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Error handling middleware
- ✅ Database connection pooling

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **TailwindCSS** - Utility-first CSS framework
- **Material-UI** - React component library
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL** - Production database

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invenio-master
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **Seed the database**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Default admin credentials:
     - Email: admin@invenio.com
     - Password: admin123

### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invenio-master
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb invenio_db
   ```

3. **Configure environment variables**
   ```bash
   # Server
   cp server/env.example server/.env
   # Edit server/.env with your database credentials
   
   # Client
   cp client/env.example client/.env.local
   # Edit client/.env.local if needed
   ```

4. **Install dependencies**
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```

5. **Run database migrations**
   ```bash
   cd server
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Seed the database**
   ```bash
   npm run seed
   ```

7. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/invenio_db
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Client (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Invenio Master
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get user profile
- `POST /auth/change-password` - Change password

### Protected Endpoints

- `GET /dashboard` - Get dashboard metrics
- `GET /products` - Get products (with pagination, search, sorting)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /users` - Get users (Manager+ access)
- `PUT /users/:id` - Update user (Manager+ access)
- `DELETE /users/:id` - Delete user (Manager+ access)

## 👥 User Roles

- **Admin**: Full system access, user management, all CRUD operations
- **Manager**: User management, all inventory operations
- **Staff**: Product management, view dashboard
- **Viewer**: Read-only access to dashboard and products

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **Users**: User accounts with roles and authentication
- **Products**: Inventory items with stock tracking
- **Sales**: Sales transactions and history
- **Purchases**: Purchase transactions and history
- **Expenses**: Business expenses by category
- **RefreshTokens**: JWT refresh token management

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## 🚀 Deployment

### Production Deployment

1. **Set up production environment variables**
2. **Build and deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

### AWS Deployment

The application is designed to be deployed on AWS with:
- **EC2** for application hosting
- **RDS** for PostgreSQL database
- **S3** for file storage
- **CloudFront** for CDN
- **Route 53** for DNS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Changelog

### Version 1.0.0
- Initial release with authentication system
- Complete inventory management features
- Dashboard with analytics
- Role-based authorization
- Docker support
- Production-ready configuration

---

**Built with ❤️ for modern inventory management**
