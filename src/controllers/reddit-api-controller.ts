import { RequestHandler } from 'express';
import axios from 'axios';
import { getTrends } from '../database/trendDB';
import { getNews } from '../database/newsDB';
import { RequestError } from '../types/RequestError';

export const getTrendsForCryptocurrency: RequestHandler = async (
  req,
  res,
  next
) => {
  getTrends(req.params.cryptocurrencyName, req.params.scrapedAfter)
    .then(
      (trends) => {
        return res.status(200).json(trends);
      },
      () => {
        throw new RequestError(404, 'Cryptocurrency could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const getNewsForCryptocurrency: RequestHandler = async (
  req,
  res,
  next
) => {
  getNews(req.params.cryptocurrencyName, req.params.subredditName)
    .then(
      (news) => {
        return res.status(200).json(news);
      },
      () => {
        throw new RequestError(404, 'Cryptocurrency could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};
