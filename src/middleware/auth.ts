import { RequestHandler } from 'express';
import { verify } from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { RequestError } from '../types/RequestError';
import { JWTTokenPayload } from '../types/JWTTokenPayload';
import { userInfoUpToDate } from '../controllers/auth-controller';
import { getUserById } from '../database/userDB';

// tested partially by calling API points
export const isAuth: RequestHandler = async (req, _, next) => {
  try {
    if (!req.get('Authorization')) {
      throw new RequestError(401, 'Unauthorized Access', 'Only authorized users have access to this page, please log in.');
    }

    const decodedJWTToken = verify(
      req.get('Authorization').split(' ')[1],
      fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'public.pem')),
    ) as JWTTokenPayload;
    if (decodedJWTToken) {
      const loadedUser = await getUserById(decodedJWTToken.userId, { notifications: 0 });
      if (loadedUser && userInfoUpToDate(loadedUser, decodedJWTToken)) {
        req.user = loadedUser;
        next();
      } else {
        next(
          new RequestError(401, 'Unauthorized Access', 'Your token expired, please refresh it or log in again.', [
            'TokenExpiredError',
          ]),
        );
      }
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(
        new RequestError(401, 'Unauthorized Access', 'Your token expired, please refresh it or log in again.', [
          'TokenExpiredError',
        ]),
      );
    } else {
      next(new RequestError(401, 'Unauthorized Access', 'Invalid token, please log in again.'));
    }
  }
};
