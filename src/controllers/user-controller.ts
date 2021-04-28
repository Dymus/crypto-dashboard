import { RequestHandler } from 'express';
import { User, UserModel } from '../models/user-model';
import { DocumentType } from "@typegoose/typegoose";
import { RequestError } from '../types/RequestError';

export const getUserAuthStatus: RequestHandler = (req, res, _) => {
  return res.status(200).json({isCoinbaseApproved: req.user.coinbaseTokens ? true : false, isGeminiApproved: req.user.geminiKeys ? true : false})
};

export const getUserAlerts: RequestHandler = (req, res, _) => {
  return res.status(200).json({alerts: req.user.alerts});
}

export const setUserAlerts: RequestHandler = (req, res, next) => {
  const filter = {_id: req.user._id};
  const update = {alerts: req.body};

  UserModel.findOneAndUpdate(filter, update, {new: true})
  .then(user => {
    if (JSON.stringify(user.alerts) === JSON.stringify(req.body)) {
      return res.status(200).json({wasSuccess: true})
    } else {
      next(new RequestError(400, 'Could not update alerts', 'Unknown error while updating user alerts'));
    }
  })
}

export const getUserAlertNotifications: RequestHandler = (req, res, _) => {
  UserModel.findById(req.user._id).then(user => {
    return res.status(200).json({alertNotifications: user.notifications})
  })
}

export const markAllUserAlertNotificationsAsViewed: RequestHandler = (req, res, _) => {
  const filter = {_id: req.user._id};
  const update = {notifications: req.body};
  UserModel.findByIdAndUpdate(filter, update).then(() => {
    return res.status(200);
  })
}

export const removeAllAlertNotifications: RequestHandler = (req, res, _) => {
  const filter = {_id: req.user._id};
  const update = {notifications: req.body};
  UserModel.findByIdAndUpdate(filter, update).then(() => {
    return res.status(200);
  })
}