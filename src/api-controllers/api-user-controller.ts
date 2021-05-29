import { RequestHandler } from 'express';

import {
  getUserAlertNotificationsFromUserDB,
  markAllUserAlertNotificationsAsViewedInUserDB,
  removeAllAlertNotificationsFromUserDB,
  setUserAlertsInUserDB,
} from '../database/userDB';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';
import { RequestError } from '../types/RequestError';

// untested endpoint, but lower level methods are tested
export const refreshUserAuthStatus: RequestHandler = async (req, res, next) => {
  try {
    const newJWTToken = await refreshJWT(req.cookies.refreshToken);
    return res.status(200).json({ JWTToken: newJWTToken });
  } catch {
    next(new RequestError(400, 'Could not refresh user authentication status', 'Unknown error while updating user token'));
  }
};

// untested endpoint, but lower level methods are tested
export const getUserAlerts: RequestHandler = (req, res, next) => {
  try {
    return res.status(200).json({ alerts: req.user.alerts });
  } catch {
    next(new RequestError(404, 'Could not get user alerts', 'Unknown error while getting user alerts'));
  }
};

// untested endpoint, but lower level methods are tested
export const setUserAlerts: RequestHandler = async (req, res, next) => {
  try {
    const updatedUser = await setUserAlertsInUserDB(req.user._id, req.body);
    return res.status(200).json({ alerts: updatedUser.alerts });
  } catch {
    next(new RequestError(400, 'Could not update alerts', 'Unknown error while updating user alerts'));
  }
};

// untested endpoint, but lower level methods are tested
export const getUserAlertNotifications: RequestHandler = async (req, res, next) => {
  try {
    const alertNotifications = await getUserAlertNotificationsFromUserDB(req.user._id);
    return res.status(200).json({ alertNotifications });
  } catch {
    next(new RequestError(404, 'Could not find notifications', 'Could not find notifications for the given user'));
  }
};

// untested endpoint, but lower level methods are tested
export const markAllUserAlertNotificationsAsViewed: RequestHandler = async (req, res, next) => {
  try {
    const updatedUser = await markAllUserAlertNotificationsAsViewedInUserDB(req.user._id);
    return res.status(200).json({ alertNotifications: updatedUser.notifications });
  } catch {
    next(new RequestError(400, 'Error while updating notifications', 'Could not mark your notifications as viewed'));
  }
};

// untested endpoint, but lower level methods are tested
export const removeAllAlertNotifications: RequestHandler = async (req, res, next) => {
  try {
    await removeAllAlertNotificationsFromUserDB(req.user._id);
    return res.status(200).send();
  } catch {
    next(new RequestError(400, 'Error while deleting notifications', 'Could not delete your notifications'));
  }
};
