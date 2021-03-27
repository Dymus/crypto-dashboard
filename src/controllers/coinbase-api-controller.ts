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
                const walletAccounts = response.data.data.map((account) => {
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
                const euroWallet = walletAccounts.splice(walletAccounts.findIndex((account) => account.type === "fiat"), 1)[0]
                res.status(200).json({
                    walletAccounts, euroWallet
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
        `https://api.coinbase.com/v2/accounts/${req.params.accountId}/transactions`,
        req.user
    ).then(
        (response) => {
            const mappedTransactions = response.data.data.map((transaction) => {
                return {
                    transactionId: transaction.id,
                    transactionDate: transaction.created_at,
                    transactionType: transaction.type,
                    transactionStatus: transaction.status,
                    transactionAmount: transaction.amount.amount,
                    transactionCurrency: transaction.amount.currency,
                    transactionFiatAmount: transaction.native_amount.amount,
                    transactionFiatCurrency: transaction.native_amount.currency,
                    transactionTitle: transaction.details.title
                }
            });
            return res.status(200).json({transactions : mappedTransactions});
        },
        () => {
            throw next(new RequestError(404, 'Could not find your transactions'));
        }
    );
};
