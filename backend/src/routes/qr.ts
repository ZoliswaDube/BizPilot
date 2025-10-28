import { Router } from 'express';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', requireBusinessAccess(), async (req, res) => {
  res.json({ message: 'QR Codes endpoint - Coming soon' });
});

export { router as qrRoutes };



