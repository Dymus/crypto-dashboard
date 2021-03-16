import { RequestHandler } from "express";
import axios from "axios";
import { UserModel } from "../models/user-model";
import { AccessTokenModel } from "../models/access-token";
import { sign } from "jsonwebtoken";
import { hashSync } from "bcrypt";

export const getCoinbaseLogin: RequestHandler = async (req, res, next) => {
    res.redirect(
        `http://www.coinbase.com/oauth/authorize?response_type=code&client_id=80035f23c3addbba5736cdc3a67b74eced44100cf00a8ad9d484958d4e7b0188&redirect_uri=http://localhost:3000/coinbase/redirect&scope=wallet:accounts:read,wallet:sells:read,wallet:buys:read,wallet:deposits:read&account=all`
    );
};

export const getCoinbaseRedirect: RequestHandler = async (req, res, next) => {
    return axios
        .post(
            `https://api.coinbase.com/oauth/token?grant_type=authorization_code&code=${req.query.code}&client_id=80035f23c3addbba5736cdc3a67b74eced44100cf00a8ad9d484958d4e7b0188&client_secret=e66c6c1693343e3ca74a5415dd360b39052d3443561ac7c9d8f5d7509853402c&redirect_uri=http://localhost:3000/coinbase/redirect`
        )
        .then(
            (response) => {
                const accessToken = new AccessTokenModel();
                accessToken.access_token = response.data.access_token;
                accessToken.token_type = response.data.token_type;
                accessToken.expires_in = response.data.expires_in;
                accessToken.refresh_token = response.data.refresh_token;
                accessToken.scope = response.data.scope;
                accessToken.save().then(() => {
                    return res.redirect(
                        `http://localhost:8080/coinbase-login-success/${response.data.access_token}`
                    );
                });
            },
            (error) => {
                return res.status(error.response.status);
            }
        );
};

export const postRegister: RequestHandler = async (req, res, next) => {
    UserModel.create({
        username: req.body.username,
        password: hashSync(req.body.password, 5),
    })
        .then((user) => {
            return user ? res.status(201).send() : res.status(409).send();
        })
        .catch((error) => {
            return res.status(500).json({ error });
        });
};

export const postLogin: RequestHandler = async (req, res, next) => {};
