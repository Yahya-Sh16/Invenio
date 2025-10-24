import { Router } from "express";
import { getExpensesByCategory } from "../controllers/expenseController";
import { authenticateToken, requireStaff } from "../middleware/auth";

const router = Router();

// Protected routes - require authentication and staff level access
router.use(authenticateToken);
router.use(requireStaff);

router.get("/", getExpensesByCategory);

export default router;