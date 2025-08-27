import { Router } from 'express';
import { authenticateToken } from '@/shared/middleware/auth';

const router = Router();

// Placeholder routes - to be implemented
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

export default router;
