import { RequestHandler } from "express";
import axios from "axios";

export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
    return axios
        .get(`https://api.coinbase.com/v2/accounts?limit=99`, {
            headers: { Authorization: `Bearer ${req.headers["coinbaseaccesstoken"]}` },
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

export const getCoinbaseTransactionsForAccount: RequestHandler = async (req, res, next) => {
    return axios
        .get(`https://api.coinbase.com/v2/accounts/${req.params.accountId}/buys`, {
            headers: { Authorization: `Bearer ${req.headers["coinbaseaccesstoken"]}` },
        })
        .then(
            (response) => {
                console.log(response.data)
                return res.status(200).json(response.data.data);
            },
            (error) => {
                return res.status(error.response.status).send();
            }
        );
};
