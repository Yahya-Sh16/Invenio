import { Router } from "express";
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "../controllers/productController";
import { authenticateToken, requireStaff } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Protected routes
// Allow authenticated users to create products. Updates and deletes still
// require staff-level permissions.
router.post("/", authenticateToken, createProduct);
router.use(authenticateToken);
router.use(requireStaff);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;