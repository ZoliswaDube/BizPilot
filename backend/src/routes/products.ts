import { Router } from 'express';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/v1/products - Get all products for a business
router.get('/', requireBusinessAccess(), async (req, res) => {
  // TODO: Implement product listing
  res.json({ message: 'Products endpoint - Coming soon' });
});

export { router as productRoutes };



