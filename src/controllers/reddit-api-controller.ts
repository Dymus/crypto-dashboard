import { RequestHandler } from "express";
import axios from "axios";
import { getTrends } from "../database/trendDB";
import { RequestError } from "../types/RequestError";

// :cryptocurrencyName

export const getTrendsForCryptocurrency: RequestHandler = async (req, res, next) => {
    getTrends(req.params.cryptocurrencyName)
    .then(
      (trends) => {
        console.log(trends)
        return res.status(200).json(trends)
      },
      () => {
        throw new RequestError(404, "Cryptocurrency could not be found");
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};