import { Router } from 'express';
import {
  getTrendsForCryptocurrency,
  getNewsForCryptocurrency,
} from '../controllers/reddit-api-controller';

const router = Router();

router.get(
  '/trends/:cryptocurrencyName/:scrapedAfter',
  getTrendsForCryptocurrency
);
router.get(
  '/news/:cryptocurrencyName/:subredditName',
  getNewsForCryptocurrency
);

export default router;
