import cryptoJs from "crypto-js";
import { RequestHandler } from "express";

export const addGeminiSecretToRequest: RequestHandler = async (req, _, next) => {
  req.geminiSecret = cryptoJs.AES.decrypt(req.user.geminiKeys.apiSecret, req.user.password).toString(cryptoJs.enc.Utf8);
  next();
}