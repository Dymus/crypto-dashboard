import { Router } from 'express';
import {
  getTrendsForCryptocurrency,
  getNewsForCryptocurrency,
  getHotTrends
} from '../controllers/reddit-api-controller';

const router = Router();

router.get('/trends', getTrendsForCryptocurrency);
router.get('/news/:cryptocurrencyName', getNewsForCryptocurrency);
router.get('/hots', getHotTrends);

export default router;
