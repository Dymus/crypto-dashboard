import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';

export const isCoinbaseAuth: RequestHandler = async (req, _, next) => {
  if (req.user.coinbaseTokens) {
    next();
  } else {
    throw next(
      new RequestError(
        401,
        "Unauthorized Access", `You haven't connected Coinbase to ${process.env.APP_NAME} yet. Please do so, and repeat the request.`
      )
    );
  }
};