import { RequestHandler } from 'express';

import { RequestError } from '../types/RequestError';
import { saveCoinbaseTokens } from '../database/userDB';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';
import { revokeCoinbaseTokens } from '../request-helpers/coinbase-request-helper';

// tested in the api-coinbase-auth-controller test suite
export const postSaveCoinbaseToken: RequestHandler = async (req, res, next) => {
  try {
    await saveCoinbaseTokens(req.user._id, req.body.coinbaseTokens);
    const newJWTToken = await refreshJWT(req.cookies.refreshToken);
    return res.status(201).json({ message: 'Coinbase tokens saved successfully', jwt: newJWTToken });
  } catch (error) {
    next(
      new RequestError(
        409,
        'Unexpected Error',
        `The server encountered an issue when trying to connect your Coinbase account with ${process.env.APP_NAME}`,
      ),
    );
  }
};

// not tested
export const deleteCoinbaseAccess: RequestHandler = async (req, res, next) => {
  revokeCoinbaseTokens(req.user)
    .then(() => {
      req.user.coinbaseTokens = null;
      return req.user.save();
    })
    .then(() => {
      return refreshJWT(req.cookies.refreshToken);
    })
    .then((newJWTToken) => res.status(201).json({ message: 'Coinbase tokens deleted successfully', JWTToken: newJWTToken }))
    .catch(() => {
      throw next(
        new RequestError(400, 'Unexpected Error', `The server encountered an issue when trying to delete your Coinbase access`),
      );
    });
};
