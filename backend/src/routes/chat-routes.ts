import { Router } from 'express';
import { chatNextHandler } from '../controllers/chat-controller';

const router = Router();
// Compose under app.use('/api/chat', router): resulting path /api/chat/next
router.post('/next', chatNextHandler);
export default router;
