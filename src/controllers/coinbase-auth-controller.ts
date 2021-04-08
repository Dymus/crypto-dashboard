import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { saveCoinbaseTokens } from '../database/userDB';
import { validationResult } from 'express-validator';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

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

export const postSaveCoinbaseToken: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, 'Invalid input', validationResult(req).array().map(error => error.msg).join(". "), validationResult(req).array())
    );
  }
  saveCoinbaseTokens(req.user._id, req.body.coinbaseTokens).then(
    () => refreshJWT(req.cookies.refreshToken),
    () => {
      throw next(
        new RequestError(
          401,
          "Unexpected Error", `The server encountered an issue when trying to connect your Coinbase account with ${process.env.APP_NAME}`
        )
      )
    }
  ).then(
    (newJWTToken) => res.status(201).json({ message: 'Coinbase tokens saved successfully', jwt: newJWTToken }),
    () => {
      throw next(
        new RequestError(
          401,
          "Unexpected Error", `The server encountered an issue when trying to reauthenticate your Coinbase account with ${process.env.APP_NAME}`
        )
      )
    }
  );
};
