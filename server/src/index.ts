import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
/* ROUTE IMPORTS */
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoutes";
/* MIDDLEWARE IMPORTS */
import { errorHandler, notFound } from "./middleware/errorHandler";

/* CONFIGURATIONS */
dotenv.config();
const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ROUTES */
// Public routes
app.use("/auth", authRoutes);

// Protected routes (will add authentication middleware later)
app.use("/dashboard", dashboardRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/expenses", expenseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ERROR HANDLING MIDDLEWARE */
app.use(notFound);
app.use(errorHandler);

/* SERVER */
const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});