import { RequestHandler } from "express";
import axios from "axios";
import { UserModel } from "../models/user-model";
import { sign } from "jsonwebtoken";
import { hashSync } from "bcrypt";

export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
    return axios
        .get(`https://api.coinbase.com/v2/accounts`, {
            headers: { Authorization: `Bearer ${req.query.access_token}` },
        })
        .then(
            (response) => {
                return res.json(response.data.data);
            },
            (error) => {
                return res.status(error.response.status);
            }
        );
};

export const getCoinbaseTransactionsForCoin: RequestHandler = async (
    req,
    res,
    next
) => {
    return axios
        .get(`https://api.coinbase.com/v2/accounts/:account_id/buy`, {
            headers: { Authorization: `Bearer ${req.query.access_token}` },
            params: { account_id: req.params.account_id },
        })
        .then(
            (response) => {
                console.log(req.params.account_id);
                return res.json(response.data.data);
            },
            (error) => {
                return res.status(error.response.status);
            }
        );
};
