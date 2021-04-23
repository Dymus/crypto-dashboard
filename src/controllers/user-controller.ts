import { RequestHandler } from 'express';
import { UserModel } from '../models/user-model';
import { RequestError } from '../types/RequestError';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

export const refreshUserAuthStatus: RequestHandler = (req, res, next) => {
  return refreshJWT(req.cookies.refreshToken).then((newJWTToken) => {
    return res.status(200).json({ JWTToken: newJWTToken })
  }).catch(() => {
    return next(new RequestError(400, 'Could not refresh user authentication status', 'Unknown error while updating user token'));
  })
};

export const getUserAlerts: RequestHandler = (req, res, _) => {
  return res.status(200).json({alerts: req.user.alerts});
}

export const setUserAlerts: RequestHandler = (req, res, next) => {
  const filter = {_id: req.user._id};
  const update = {alerts: req.body};

  UserModel.findOneAndUpdate(filter, update, {new: true})
    .then((user) => {
    if (JSON.stringify(user.alerts) === JSON.stringify(req.body)) {
      return res.status(200).json({wasSuccess: true})
    } else {
      next(new RequestError(400, 'Could not update alerts', 'Unknown error while updating user alerts'));
    }
  })
}