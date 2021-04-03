import { RequestHandler } from 'express';
import { getTrends } from '../database/trendDB';
import { getNews } from '../database/newsDB';
import { RequestError } from '../types/RequestError';
import { getHotTrends } from '../database/hotTrendDB';

export const getTrendsForCryptocurrency: RequestHandler = async (
  req,
  res,
  next
) => {
  getTrends()
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
  getNews(req.params.cryptocurrencyName)
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

export const getHotTrendsAll: RequestHandler = async (req, res, next) => {
  getHotTrends()
    .then(
      (hotTrends) => {
        console.log(hotTrends)
        return res.status(200).json(hotTrends);
      },
      () => {
        throw new RequestError(404, 'Trends not found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};
