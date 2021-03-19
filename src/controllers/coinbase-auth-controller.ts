import { RequestHandler } from "express";
import { AccessTokenModel } from "../models/access-token";
import cryptoJs from "crypto-js";
import { UserModel } from "../models/user-model";
import { RequestError } from "../types/RequestError";

export const isCoinbaseAuth: RequestHandler = async (req, res, next) => {
    if (req.isCoinbaseApproved) {
        UserModel.findById(req.userId).then((user) => {
            req.coinbaseAccessToken = user.coinbaseAccessToken.access_token;
            req.coinbaseRefreshToken = user.coinbaseAccessToken.refresh_token;
        });
    } else {
        next(new RequestError(401, "Unauthorized Access"));
    }
};

export const postSaveCoinbaseToken: RequestHandler = async (req, res, next) => {
    UserModel.findById("req.userId")
        .then((user) => {
            user.coinbaseAccessToken = {
                access_token: req.body.coinbaseTokens.access_token,
                refresh_token: cryptoJs.AES.encrypt(
                    req.body.access_token.refresh_token,
                    user.password
                ).toString(),
            };
            return user.save();
        })
        .then(
            () => res.status(201).send(),
            () => res.status(500).send()
        );
};
