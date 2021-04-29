import { RequestHandler } from 'express';
import { getUserAlertNotificationsFromUserDB, markAllUserAlertNotificationsAsViewedInUserDB, removeAllAlertNotificationsFromUserDB, setUserAlertsInUserDB } from '../database/userDB';
import { RequestError } from '../types/RequestError';

export const getUserAuthStatus: RequestHandler = (req, res, _) => {
  return res.status(200).json({ isCoinbaseApproved: req.user.coinbaseTokens ? true : false, isGeminiApproved: req.user.geminiKeys ? true : false })
};

export const getUserAlerts: RequestHandler = (req, res, _) => {
  return res.status(200).json({ alerts: req.user.alerts })
}

export const setUserAlerts: RequestHandler = (req, res, next) => {
  setUserAlertsInUserDB(req.user._id, req.body)
    .then(
      (updatedUser) => {
        return res.status(200).json({ alerts: updatedUser.alerts })
      },
      () => {
        next(new RequestError(400, 'Could not update alerts', 'Unknown error while updating user alerts'));
      }
  )
}

export const getUserAlertNotifications: RequestHandler = (req, res, next) => {
  getUserAlertNotificationsFromUserDB(req.user._id)
    .then(
      (alertNotifications) => {
        return res.status(200).json({ alertNotifications })
      },
      () => {
        next(new RequestError(404, 'Could not find notifications', 'Could not find notifications for the given user'));
      }
    )
}

export const markAllUserAlertNotificationsAsViewed: RequestHandler = (req, res, next) => {
  markAllUserAlertNotificationsAsViewedInUserDB(req.user._id)
    .then(
      (updatedUser) => {
        return res.status(200).json({ alertNotifications: updatedUser.notifications });
      },
      () => {
        next(new RequestError(400, 'Error while updating notifications', 'Could not mark your notifications as viewed'));
      }
    )
}

export const removeAllAlertNotifications: RequestHandler = (req, res, next) => {
  removeAllAlertNotificationsFromUserDB(req.user._id).then(
    () => {
      return res.status(200).send();
    },
    () => {
      next(new RequestError(400, 'Error while deleting notifications', 'Could not delete your notifications'));
    }
  )
}