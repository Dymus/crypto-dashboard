import { RequestHandler } from 'express';
import { sign, verify } from 'jsonwebtoken';
import { compareSync, hashSync } from 'bcrypt';
import { validationResult } from 'express-validator';
import { RequestError } from '../types/RequestError';
import { createUser, getUser, getUserById } from '../database/userDB';
import path from 'path';
import fs from 'fs';
import { TokenPayload } from '../types/TokenPayload';
import { UserModel } from '../models/user-model';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

export const refreshToken: RequestHandler = (req, res, next) => {
  refreshJWT(req.cookies.refreshToken)
    .then(
      (newJWTToken) => { return res.status(201).json({ jwt: newJWTToken }) },
      () => {
        return next(
          new RequestError(401, 'Unauthorized Access', [
            'ExpiredRefreshError',
          ])
        );
      }
  ).catch((internalError) => {
      return next(internalError);
  })
};

export const isAuth: RequestHandler = (req, _, next) => {
  try {
    if (!req.get('Authorization')) {
      throw new RequestError(401, 'Unauthorized Access');
    }

    verify(
      req.get('Authorization').split(' ')[1],
      fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'public.pem')),
      async (error, decodedToken: TokenPayload) => {
        if (!error) {
          req.user = await UserModel.findById(decodedToken.userId).exec();
          next();
        } else if (error.name === 'TokenExpiredError') {
          next(new RequestError(401, 'Unauthorized Access', ['TokenExpiredError']));
        } else {
          next(new RequestError(401, 'Unauthorized Access'));
        }
      }
    );
  } catch (internalError) {
    next(internalError);
  }
};

export const postRegister: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, 'Invalid input', validationResult(req).array())
    );
  }
  createUser({
    email: req.body.email,
    password: hashSync(req.body.password, 5),
  })
    .then(
      () => {
        return res.status(201).send();
      },
      () => {
        throw new RequestError(409, 'User could not be created');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const postLogin: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, 'Invalid input', validationResult(req).array())
    );
  }

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
                  fs.readFileSync(
                    path.join(__dirname, '..', '..', 'keys', 'private.pem')
                  ),
                  {
                    expiresIn: 2678400,
                    algorithm: 'RS256',
                  }
                ),
                { httpOnly: true, maxAge: 2678400, }
              )
              .json({
                jwt: sign(
                  {
                    userId: user._id,
                    email: user.email,
                    isCoinbaseApproved: user.coinbaseTokens ? true : false,
                  },
                  fs.readFileSync(
                    path.join(__dirname, '..', '..', 'keys', 'private.pem')
                  ),
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
                  fs.readFileSync(
                    path.join(__dirname, '..', '..', 'keys', 'private.pem')
                  ),
                  {
                    expiresIn: 86400,
                    algorithm: 'RS256',
                  }
                ),
                { httpOnly: true }
              )
              .json({
                jwt: sign(
                  {
                    userId: user._id,
                    email: user.email,
                    isCoinbaseApproved: user.coinbaseTokens ? true : false,
                  },
                  fs.readFileSync(
                    path.join(__dirname, '..', '..', 'keys', 'private.pem')
                  ),
                  {
                    expiresIn: 7200,
                    algorithm: 'RS256',
                  }
                ),
              });
          }
        } else {
          throw new RequestError(
            401,
            'Password does not match with this email'
          );
        }
      },
      () => {
        throw new RequestError(404, 'User could not be found');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};
