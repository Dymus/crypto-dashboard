import { RequestHandler } from "express";
import { setGeminiApiKeys } from "../database/userDB";
import { RequestError } from "../types/RequestError";

export const setGeminiApiAndSecret: RequestHandler = async (req, res, next) => {
    console.log(req.user)
    setGeminiApiKeys(req.user._id, req.body.apiKey, req.body.apiSecret)
    .then((savedUser) => res.status(201).json({ message: 'Gemini tokens saved successfully', user: savedUser }),
        () => {
          throw next(
            new RequestError(
              401,
              "Unexpected Error", `The server encountered an issue when trying to save your Gemini access information with ${process.env.APP_NAME}`
            )
          )
        }
      );
}