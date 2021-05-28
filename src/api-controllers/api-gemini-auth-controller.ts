import { RequestHandler } from 'express';

import { setGeminiApiKeys } from '../database/userDB';
import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';
import { RequestError } from '../types/RequestError';

// tested in the api-gemini-auth-controller test suite
export const setGeminiApiAndSecret: RequestHandler = async (req, res, next) => {
  try {
    await setGeminiApiKeys(req.user._id, req.body.apiKey, req.body.apiSecret);
    const newJWTToken = await refreshJWT(req.cookies.refreshToken);
    return res.status(201).json({ message: 'Gemini tokens saved successfully', JWTToken: newJWTToken });
  } catch {
    next(
      new RequestError(
        400,
        'Unexpected Error',
        `The server encountered an issue when trying to authenticate your Gemini account with ${process.env.APP_NAME}`
      )
    );
  }
};

// tested in the api-gemini-auth-controller test suite
export const deleteGeminiAccess: RequestHandler = async (req, res, next) => {
  try {
    req.user.geminiKeys = null;
    await req.user.save();
    const newJWTToken = await refreshJWT(req.cookies.refreshToken);
    return res.status(200).json({ message: 'Gemini tokens deleted successfully', JWTToken: newJWTToken });
  } catch {
    next(
      new RequestError(
        400,
        'Unexpected Error',
        `The server encountered an issue when trying to delete your Gemini API keys`
      )
    );
  }
};
