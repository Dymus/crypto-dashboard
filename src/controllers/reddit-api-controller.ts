import { RequestHandler } from 'express';
import { getTrends } from '../database/trendDB';
import { getNews } from '../database/newsDB';
import { getHots } from '../database/hotDB';
import { RequestError } from '../types/RequestError';

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
        throw new RequestError(404, "Reddit Error", 'Cryptocurrency could not be found');
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
        throw new RequestError(404, "Reddit Error", 'Cryptocurrency could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const getHotTrends: RequestHandler = async (
  req,
  res,
  next
) => {
  getHots()
    .then(
      (hotTrends) => {
        return res.status(200).json(hotTrends);
      },
      () => {
        throw new RequestError(404, "Reddit Error", 'Hot trends could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};