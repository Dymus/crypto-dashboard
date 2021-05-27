import { RequestHandler } from 'express';
import { check, validationResult } from 'express-validator';

import { UserModel } from '../models/user-model';
import { RequestError } from '../types/RequestError';

export const validateRegistration: RequestHandler = async (req, _2, next) => {
  await check('email')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail()
    .custom(async (value) => {
      return UserModel.findOne({ email: value }).then((user) => {
        if (user) {
          return Promise.reject('This email is already taken');
        }
      });
    })
    .run(req);

  await check('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must have at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage('Password must have at least one letter in lowercase, uppercase and number')
    .run(req);

  next();
};

export const validateLogin: RequestHandler = async (req, _2, next) => {
  await check('email')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail()
    .custom(async (value) => {
      return UserModel.findOne({ email: value }).then((user) => {
        if (!user) {
          return Promise.reject('User with a given email does not exist');
        }
      });
    })
    .run(req);

  await check('password').trim().run(req);

  next();
};

export const validateGetCoinbaseTransactions: RequestHandler = async (req, _, next) => {
  await check('accountId').isAlphanumeric().withMessage('Invalid account ID').run(req);

  next();
};

export const validateSaveCoinbaseToken: RequestHandler = async (req, _, next) => {
  await check('coinbaseTokens')
    .custom((coinbaseTokens) => {
      if ('access_token' in coinbaseTokens && 'refresh_token' in coinbaseTokens) {
        return true;
      } else {
        return false;
      }
    })
    .run(req);

  next();
};

export const checkValidationResult: RequestHandler = async (req, _, next) => {
  if (!validationResult(req).isEmpty()) {
    next(
      new RequestError(
        422,
        'Invalid input',
        validationResult(req)
          .array()
          .map((error) => error.msg)
          .join('. '),
        validationResult(req).array()
      )
    );
  } else {
    next();
  }
};
