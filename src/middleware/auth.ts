import { RequestHandler } from 'express';
import { verify } from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { RequestError } from '../types/RequestError';
import { JWTTokenPayload } from '../types/JWTTokenPayload';
import { UserModel } from '../models/user-model';
import { userInfoUpToDate } from '../controllers/auth-controller';

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
          const loadedUser = await UserModel.findById(decodedJWTToken.userId, { notifications: 0 }).exec();
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