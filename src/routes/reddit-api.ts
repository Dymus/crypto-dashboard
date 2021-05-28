import { Router } from 'express';

import * as Validator from '../middleware/validation'
import * as ApiRedditController from '../api-controllers/api-reddit-controller';

const router = Router();

router.get('/trends', ApiRedditController.getTrendsForCryptocurrency);

router.get('/news/:cryptocurrencyName', Validator.validateGetNews, ApiRedditController.getNewsForCryptocurrency);

router.get('/hots', ApiRedditController.getHotTrends);

export default router;
