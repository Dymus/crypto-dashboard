import { Router } from 'express';
import {
  getTrendsForCryptocurrency,
  getNewsForCryptocurrency,
  getHotTrendsAll
} from '../controllers/reddit-api-controller';

const router = Router();

router.get('/trends', getTrendsForCryptocurrency);
router.get('/news/:cryptocurrencyName', getNewsForCryptocurrency);
router.get('/hotTrends', getHotTrendsAll)

export default router;
