import { RequestHandler } from "express";
import { getTrends } from "../database/trendDB";
import { RequestError } from "../types/RequestError";

export const getTrendsForCryptocurrency: RequestHandler = async (req, res, next) => {
    getTrends(req.params.cryptocurrencyName, req.params.scrapedAfter)
    .then(
      (trends) => {
        return res.status(200).json(trends)
      },
      () => {
        throw new RequestError(404, "Trends Not Found","Could not find trends for the given cryptocurrency.");
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};