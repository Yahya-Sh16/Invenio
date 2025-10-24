import { Router } from "express";
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser 
} from "../controllers/userController";
import { authenticateToken, requireManager } from "../middleware/auth";

const router = Router();

// Protected routes - require authentication and manager level access
router.use(authenticateToken);
router.use(requireManager);

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;