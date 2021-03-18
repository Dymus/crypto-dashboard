import { RequestHandler } from "express";
import axios from "axios";
import { AccessTokenModel } from "../models/access-token";

export const postSaveCoinbaseToken: RequestHandler = async (req, res, next) => {
    const accessToken = new AccessTokenModel(req.body.accessToken);
    accessToken.save().then(
        () => res.status(201).send(),
        () => res.status(500).send()
    );
};
