import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { saveCoinbaseTokens } from '../database/userDB';
import { validationResult } from 'express-validator';

export const isCoinbaseAuth: RequestHandler = async (req, _, next) => {
  if (req.user.coinbaseTokens) {
    next();
  } else {
    throw next(
      new RequestError(
        401,
        "Unauthorized Access. You haven't connected this app to Coinbase yet."
      )
    );
  }
};

export const postSaveCoinbaseToken: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    throw next(
      new RequestError(422, 'Invalid input', validationResult(req).array())
    );
  }
  saveCoinbaseTokens(req.user._id, req.body.coinbaseTokens).then(
    () => res.status(201).json({ message: 'User successfully created' }),
    () =>
      res.status(500).json({ errorMessage: 'Could not save token to the DB' })
  );
};
