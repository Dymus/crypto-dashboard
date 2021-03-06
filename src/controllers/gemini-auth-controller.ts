import { DocumentType } from "@typegoose/typegoose";
import cryptoJs from "crypto-js";
import { RequestHandler } from "express";
import { setGeminiApiKeys } from "../database/userDB";
import { refreshJWT } from "../jwt-helpers/refresh-jwt-helper";
import { User } from "../models/user-model";
import { RequestError } from "../types/RequestError";

export const setGeminiApiAndSecret: RequestHandler = async (req, res, next) => {
    setGeminiApiKeys(req.user._id, req.body.apiKey, req.body.apiSecret)
      .then((savedUser) => {
        return refreshJWT(req.cookies.refreshToken)
      },
        () => {
          throw next(
            new RequestError(
              401,
              "Unexpected Error", `The server encountered an issue when trying to save your Gemini access information with ${process.env.APP_NAME}`
            )
          )
        }
      ).then(
        (newJWTToken) => {
          return res.status(201).json({ message: 'Gemini tokens saved successfully', JWTToken: newJWTToken })
        },
        () => {
          throw next(
            new RequestError(
              401,
              "Unexpected Error", `The server encountered an issue when trying to authenticate your Gemini account with ${process.env.APP_NAME}`
            )
          )
        }
      );
}

export const addGeminiSecretToRequest: RequestHandler = async (req, _, next) => {
  req.geminiSecret = cryptoJs.AES.decrypt(req.user.geminiKeys.apiSecret, req.user.password).toString(cryptoJs.enc.Utf8);
  next();
}

export const deleteGeminiAccess: RequestHandler = async (req, res, next) => {
  req.user.geminiKeys = null;
  req.user.save().then((savedUser) => {
    return refreshJWT(req.cookies.refreshToken)
  }).then((newJWTToken) =>
    res.status(201).json({ message: 'Gemini tokens deleted successfully', JWTToken: newJWTToken }
    )).catch((error) => {
      console.log(error)
      throw next(
        new RequestError(
          400,
          "Unexpected Error", `The server encountered an issue when trying to delete your Gemini API keys`
        )
      )
    })
}