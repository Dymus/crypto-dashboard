import { RequestHandler } from 'express';
import { User, UserModel } from '../models/user-model';
import { DocumentType } from "@typegoose/typegoose";

export const getUserAuthStatus: RequestHandler = (req, res, _) => {
  return res.status(200).json({isCoinbaseApproved: req.user.coinbaseTokens ? true : false, isGeminiApproved: req.user.geminiKeys ? true : false})
};

export const getUserAlerts: RequestHandler = (req, res, _) => {
  return res.status(200).json({alerts: req.user.alerts});
}

export const setUserAlerts: RequestHandler = (req, res, _) => {
  const filter = {_id: req.user._id};
  const update = {alerts: req.body};

  UserModel.findOneAndUpdate(filter, update, {new: true})
  .then(user => {
    if (JSON.stringify(user.alerts) === JSON.stringify(req.body)) {
      return res.status(200).json({wasSuccess: true})
    } else {
      return res.status(400).json({error: 'Unknown error while updating user alerts'})
    }
  })
}