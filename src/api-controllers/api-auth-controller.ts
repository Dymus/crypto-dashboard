import { RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import { compare, compareSync, hashSync } from 'bcrypt';
import path from 'path';
import fs from 'fs';

import { RequestError } from '../types/RequestError';
import { createUser, getUser } from '../database/userDB';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

// tested in the api-auth-controller test suite
export const refreshJWTToken: RequestHandler = async (req, res, next) => {
  try {
    const newJWTToken = await refreshJWT(req.cookies.refreshToken);
    if (newJWTToken) {
      return res.status(201).json({ jwt: newJWTToken });
    }
  } catch {
    next(
      new RequestError(401, 'Unauthorized Access', 'Refresh token expired, please log in again.', [
        'ExpiredRefreshError',
      ])
    );
  }
};

// tested in the api-auth-controller test suite
export const postRegister: RequestHandler = async (req, res, next) => {
  try {
    if (await createUser({ email: req.body.email, password: hashSync(req.body.password, 5) })) {
      return res.status(201).send();
    }
  } catch {
    next(
      new RequestError(
        409,
        'User Not Created',
        'User could not be created. Please reload the page and try again. If the problem persists, contact the support.'
      )
    );
  }
};

// tested in the api-auth-controller test suite
export const postLogin: RequestHandler = async (req, res, next) => {
  try {
    const user = await getUser(req.body.email);
    const compareResult = await compare(req.body.password, user.password);
    if (compareResult) {
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
              { userId: user._id.toString() },
              fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
              { expiresIn: 7200, algorithm: 'RS256' }
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
  } catch (error) {
    next(error);
  }
};
