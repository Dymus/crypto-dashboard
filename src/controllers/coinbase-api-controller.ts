import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { coinbaseGet } from '../coinbase-api-helper/coinbase-request-helper';
import { validationResult } from "express-validator";

export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
    coinbaseGet(
        'https://api.coinbase.com/v2/accounts?limit=99',
        req.user
    )
        .then(
            (response) => {
                res.status(200).json({
                    accounts: response.data.data.map((account) => {
                        return {
                            accountId: account.id,
                            type: account.type,
                            code: account.currency.code,
                            name: account.currency.name,
                            color: account.currency.color,
                            assetId: account.currency.asset_id,
                            balance: +account.balance.amount,
                            slug: account.currency.slug,
                        }
                    })
                })
            },
            (error) => {
                throw next(new RequestError(404, 'Could not find your Coinbase wallet'));
            }
        ).catch((internalError) => {
            throw next(internalError);
        })
};

export const getCoinbaseTransactionsForAccount: RequestHandler = async (
    req,
    res,
    next
) => {
    if (!validationResult(req).isEmpty()) {
        throw next(
            new RequestError(
                422,
                "Invalid input",
                validationResult(req).array()
            )
        );
    }
    coinbaseGet(
        `https://api.coinbase.com/v2/accounts/${req.params.accountId}/buys`,
        req.user
    ).then(
        (response) => {
            return res.status(200).json(response.data.data);
        },
        () => {
            throw next(new RequestError(404, 'Could not find your transactions'));
        }
    );
};
