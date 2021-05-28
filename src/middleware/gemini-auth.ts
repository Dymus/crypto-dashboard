import cryptoJs from "crypto-js";
import { RequestHandler } from "express";
import { RequestError } from "../types/RequestError";

// tested partially by calling API points
export const addGeminiSecretToRequest: RequestHandler = async (req, _, next) => {
  req.geminiSecret = cryptoJs.AES.decrypt(req.user.geminiKeys.apiSecret, req.user.password).toString(cryptoJs.enc.Utf8);
  next();
}

// tested partially by calling API points
export const isGeminiAuth: RequestHandler = async (req, _, next) => {
  if (req.user.geminiKeys && req.user.geminiKeys.apiKey && req.user.geminiKeys.apiSecret) {
    next();
  } else {
    next(
      new RequestError(
        401,
        "Unauthorized Access", `You haven't connected Gemini to ${process.env.APP_NAME} yet. Please do so, and repeat the request.`
      )
    );
  }
}

