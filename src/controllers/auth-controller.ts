import { RequestHandler } from 'express';
import { sign, verify } from 'jsonwebtoken';
import { compareSync, hashSync } from 'bcrypt';
import { validationResult } from 'express-validator';
import { RequestError } from '../types/RequestError';
import { createUser, getUser } from '../database/userDB';
import path from 'path';
import fs from 'fs';
import { JWTTokenPayload } from '../types/JWTTokenPayload';
import { User, UserModel } from '../models/user-model';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';
import { DocumentType } from '@typegoose/typegoose';

export const refreshJWTToken: RequestHandler = (req, res, next) => {
  refreshJWT(req.cookies.refreshToken)
    .then(
      (newJWTToken) => { return res.status(201).json({ jwt: newJWTToken }) },
      () => {
        return next(
          new RequestError(401, 'Unauthorized Access', 'Refresh token expired, please log in again.', [
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
      throw new RequestError(401, 'Unauthorized Access', 'Only authorized users have access to this page, please log in.');
    }

    verify(
      req.get('Authorization').split(' ')[1],
      fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'public.pem')),
      async (error, decodedJWTToken: JWTTokenPayload) => {
        if (!error) {
          const loadedUser = await UserModel.findById(decodedJWTToken.userId).exec();
          if (userInfoUpToDate(loadedUser, decodedJWTToken)) {
            req.user = loadedUser;
            next();
          } else {
            next(new RequestError(401, 'Unauthorized Access', 'Your token expired, please refresh it or log in again.', ['TokenExpiredError']));
          }
        } else if (error.name === 'TokenExpiredError') {
          next(new RequestError(401, 'Unauthorized Access', 'Your token expired, please refresh it or log in again.', ['TokenExpiredError']));
        } else {
          next(new RequestError(401, 'Unauthorized Access', 'Invalid token, please log in again.'));
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
      new RequestError(422, 'Invalid input', validationResult(req).array().map(error => error.msg).join(". "), validationResult(req).array())
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
        throw new RequestError(409, 'User Not Created', 'User could not be created. Please reload the page and try again. If the problem persists, contact the support.');
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const postLogin: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, 'Invalid input', validationResult(req).array().map(error => error.msg).join(". "), validationResult(req).array())
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
                { httpOnly: true, maxAge: 2678400000, }
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
                    expiresIn: 7200,
                    algorithm: 'RS256',
                  }
                ),
                { httpOnly: true, maxAge: 7200000, }
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
            'Invalid Credentials',
            'Password does not match with this email'
          );
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

const userInfoUpToDate = (user: DocumentType<User>, decodedJWTToken: JWTTokenPayload) => {
  // TODO add more things that could often change in the JWT
  if (decodedJWTToken.isCoinbaseApproved) {
    return user.coinbaseTokens !== null
  } else {
    return user.coinbaseTokens === null
  }
}