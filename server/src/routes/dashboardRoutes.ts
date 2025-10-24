import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { authenticateToken, requireStaff } from "../middleware/auth";

const router = Router();

// Protected routes - require authentication and staff level access
router.use(authenticateToken);
router.use(requireStaff);

router.get("/", getDashboardMetrics);

export default router;