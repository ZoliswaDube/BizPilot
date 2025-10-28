import { Router } from 'express';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', requireBusinessAccess(), async (req, res) => {
  res.json({ message: 'Suppliers endpoint - Coming soon' });
});

export { router as supplierRoutes };



