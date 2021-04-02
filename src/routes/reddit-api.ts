import { Router } from 'express';
import {
  getTrendsForCryptocurrency,
  getNewsForCryptocurrency,
} from '../controllers/reddit-api-controller';

const router = Router();

router.get(
  '/trends',
  getTrendsForCryptocurrency
);
router.get('/news/:cryptocurrencyName', getNewsForCryptocurrency);

export default router;
