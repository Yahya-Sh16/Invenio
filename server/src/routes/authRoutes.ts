import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  logoutAll, 
  changePassword, 
  getProfile 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes
router.use(authenticateToken); // All routes below require authentication
router.get('/profile', getProfile);
router.post('/change-password', changePassword);
router.post('/logout-all', logoutAll);

export default router;
