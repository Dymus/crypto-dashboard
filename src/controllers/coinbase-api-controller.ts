import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { coinbaseGet } from '../coinbase-api-helper/coinbase-request-helper';
import { validationResult } from "express-validator";

// export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
//     let coinbaseAccounts: any[];
//     let mappedCoinbaseAccounts: CoinbaseAccount[];
//     coinbaseGet(
//         'https://api.coinbase.com/v2/accounts?limit=99',
//         req.user.coinbaseTokens,
//         req.user._id
//     )
//         .then(
//             (response) => {
//                 coinbaseAccounts = response.data.data;
//                 const requiredForFiat = (response.data.data as any[])
//                     .map((account) => {
//                         if (+account.balance.amount !== 0) {
//                             return account.currency.slug;
//                         }
//                         return null;
//                     })
//                     .filter(Boolean)
//                     .join(',');

//                 return axios.get(
//                     `https://api.coingecko.com/api/v3/simple/price?ids=${requiredForFiat}&vs_currencies=eur`
//                 );
//             },
//             (error) => {
//                 throw next(
//                     new RequestError(404, 'Could not find your Coinbase wallet')
//                 );
//             }
//         )
//         .then(
//             (response) => {
//                 let walletTotalFiat = 0;
//                 let accountOnHand: CoinbaseAccount;
//                 mappedCoinbaseAccounts = coinbaseAccounts.map((account) => {
//                     accountOnHand = {
//                         accountId: account.id,
//                         code: account.currency.code,
//                         name: account.currency.name,
//                         color: account.currency.color,
//                         assetId: account.currency.asset_id,
//                         balance: +account.balance.amount,
//                         fiatBalance: response.data[account.currency.slug]
//                             ? +account.balance.amount *
//                             response.data[account.currency.slug].eur
//                             : 0,
//                         allocation: 0,
//                         slug: account.currency.slug,
//                     };
//                     walletTotalFiat += accountOnHand.fiatBalance;
//                     return accountOnHand;
//                 });
//                 mappedCoinbaseAccounts.sort((account1, account2) => {
//                     return account2.fiatBalance - account1.fiatBalance;
//                 });
//                 if (walletTotalFiat > 0) {
//                     mappedCoinbaseAccounts.forEach((account) => {
//                         if (account.fiatBalance > 0) {
//                             account.allocation =
//                                 (account.fiatBalance / walletTotalFiat) * 100;
//                         }
//                     });
//                 }
//                 return res.status(200).json({
//                     walletTotalFiat,
//                     accounts: mappedCoinbaseAccounts,
//                 });
//             },
//             () => {
//                 throw next(
//                     new RequestError(404, 'Could not get current info from Coingecko')
//                 );
//             }
//         ).catch((internalError) => {
//             throw next(internalError);
//         })
// };

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
