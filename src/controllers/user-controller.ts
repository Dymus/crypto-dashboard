import { RequestHandler } from 'express';

export const getUserAuthStatus: RequestHandler = (req, res, _) => {
  return res.status(200).json({isCoinbaseApproved: req.user.coinbaseTokens ? true : false, isGeminiApproved: req.user.geminiKeys ? true : false})
};