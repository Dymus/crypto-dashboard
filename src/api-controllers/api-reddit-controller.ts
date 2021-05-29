import { RequestHandler } from 'express';

import { getTrends } from '../database/trendDB';
import { getNews } from '../database/newsDB';
import { getHots } from '../database/hotDB';
import { RequestError } from '../types/RequestError';

export const getTrendsForCryptocurrency: RequestHandler = async (_, res, next) => {
  try {
    const trends = await getTrends();
    return res.status(200).json(trends);
  } catch {
    return next(new RequestError(404, 'Reddit Error', 'Cryptocurrency could not be found'));
  }
};

export const getNewsForCryptocurrency: RequestHandler = async (req, res, next) => {
  try {
    const news = getNews(req.params.cryptocurrencyName);
    return res.status(200).json(news);
  } catch {
    return next(new RequestError(404, 'Reddit Error', 'Cryptocurrency could not be found'));
  }
};

export const getHotTrends: RequestHandler = async (_, res, next) => {
  try {
    const hotTrends = await getHots();
    return res.status(200).json(hotTrends);
  } catch {
    return next(new RequestError(404, 'Reddit Error', 'Hot trends could not be found'));
  }
};
