import { RequestHandler } from 'express';
import { check, validationResult } from 'express-validator';

import { UserModel } from '../models/user-model';
import { RequestError } from '../types/RequestError';

// tested partially by calling API points
export const validateRegistration: RequestHandler = async (req, _2, next) => {
  if (req.body.email && req.body.password) {
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
  } else {
    next(new RequestError(422, 'Invalid input', 'email and password are required'));
  }
};

// tested partially by calling API points
export const validateLogin: RequestHandler = async (req, _2, next) => {
  if (req.body.email && req.body.password) {
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
  } else {
    next(new RequestError(422, 'Invalid input', 'email and password are required'));
  }
};

// tested partially by calling API points
export const validateGetCoinbaseTransactions: RequestHandler = async (req, _, next) => {
  if ('accountId' in req.params) {
    next();
  } else {
    next(new RequestError(422, 'Invalid input', 'Account ID is required'));
  }
};

// tested partially by calling API points
export const validateSaveCoinbaseToken: RequestHandler = async (req, _, next) => {
  if (req.body.coinbaseTokens && 'access_token' in req.body.coinbaseTokens && 'refresh_token' in req.body.coinbaseTokens) {
    next();
  } else {
    next(new RequestError(422, 'Invalid input', 'Coinbase tokens are required'));
  }
};

// tested partially by calling API points
export const validateSaveGeminiKeys: RequestHandler = async (req, _, next) => {
  if (req.body.apiKey && req.body.apiSecret) {
    next();
  } else {
    next(new RequestError(422, 'Invalid input', 'Gemini API key and secret are required'));
  }
};

// tested partially by calling API points
export const validateSetUserAlerts: RequestHandler = async (req, _, next) => {
  if (req.body) {
    next();
  } else {
    next(new RequestError(422, 'Invalid input', 'Alerts are required'));
  }
};

// tested partially by calling API points
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
        validationResult(req).array(),
      ),
    );
  } else {
    next();
  }
};

// tested partially by calling API points
export const validateGetNews: RequestHandler = async (req, _, next) => {
  if (req.params.cryptocurrencyName) {
    next();
  } else {
    next(new RequestError(422, 'Invalid input', 'Cryptocurrency name is required'));
  }
};
