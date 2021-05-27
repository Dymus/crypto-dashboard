import { RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import { compareSync, hashSync } from 'bcrypt';
import path from 'path';
import fs from 'fs';

import { RequestError } from '../types/RequestError';
import { createUser, getUser } from '../database/userDB';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

export const refreshJWTToken: RequestHandler = (req, res, next) => {
  try {
    const newJWTToken = refreshJWT(req.cookies.refreshToken);
    if (newJWTToken) {
      return res.status(201).json({ jwt: newJWTToken });
    }
  } catch (e) {
    return next(
      new RequestError(401, 'Unauthorized Access', 'Refresh token expired, please log in again.', [
        'ExpiredRefreshError',
      ])
    );
  }
};

export const postRegister: RequestHandler = async (req, res, next) => {
  createUser({
    email: req.body.email,
    password: hashSync(req.body.password, 5),
  })
    .then(
      () => {
        return res.status(201).send();
      },
      () => {
        throw new RequestError(
          409,
          'User Not Created',
          'User could not be created. Please reload the page and try again. If the problem persists, contact the support.'
        );
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const postLogin: RequestHandler = async (req, res, next) => {
  getUser(req.body.email)
    .then(
      (user) => {
        if (compareSync(req.body.password, user.password)) {
          if (req.body.rememberMe) {
            return res
              .status(200)
              .cookie(
                'refreshToken',
                sign(
                  {
                    userId: user._id.toString(),
                  },
                  fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
                  {
                    expiresIn: 2678400,
                    algorithm: 'RS256',
                  }
                ),
                { httpOnly: true, maxAge: 2678400000 }
              )
              .json({
                jwt: sign(
                  {
                    userId: user._id,
                    email: user.email,
                    isCoinbaseApproved: user.coinbaseTokens ? true : false,
                    isGeminiApproved: user.geminiKeys ? true : false,
                  },
                  fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
                  {
                    expiresIn: 7200,
                    algorithm: 'RS256',
                  }
                ),
              });
          } else {
            return res
              .cookie(
                'refreshToken',
                sign(
                  {
                    userId: user._id.toString(),
                  },
                  fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
                  {
                    expiresIn: 7200,
                    algorithm: 'RS256',
                  }
                ),
                { httpOnly: true, maxAge: 7200000 }
              )
              .json({
                jwt: sign(
                  {
                    userId: user._id,
                    email: user.email,
                    isCoinbaseApproved: user.coinbaseTokens ? true : false,
                    isGeminiApproved: user.geminiKeys ? true : false,
                  },
                  fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
                  {
                    expiresIn: 7200,
                    algorithm: 'RS256',
                  }
                ),
              });
          }
        } else {
          throw new RequestError(401, 'Invalid Credentials', 'Password does not match with this email');
        }
      },
      () => {
        throw new RequestError(404, 'User Not Found', 'User could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};
