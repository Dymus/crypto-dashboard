import { RequestHandler } from "express";
import axios from "axios";
import { RequestError } from "../types/RequestError";

export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
    let coinbaseAccounts: any[];
    let mappedCoinbaseAccounts: CoinbaseAccount[];
    return axios
        .get(`https://api.coinbase.com/v2/accounts?limit=99`, {
            headers: {
                Authorization: `Bearer ${req.headers["coinbaseaccesstoken"]}`,
            },
        })
        .then(
            (response) => {
                coinbaseAccounts = response.data.data;

                const requiredForFiat = (response.data.data as any[])
                    .map((account) => {
                        if (+account.balance.amount !== 0) {
                            return account.currency.slug;
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .join(",");

                return axios.get(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${requiredForFiat}&vs_currencies=eur`
                );
            },
            (error) => {
                throw new RequestError(500, "Server Error");
            }
        )
        .then(
            (response) => {
                let walletTotalFiat = 0;
                let accountOnHand: CoinbaseAccount;
                mappedCoinbaseAccounts = coinbaseAccounts.map((account) => {
                    accountOnHand = {
                        accountId: account.id,
                        code: account.currency.code,
                        name: account.currency.name,
                        color: account.currency.color,
                        assetId: account.currency.asset_id,
                        balance: +account.balance.amount,
                        fiatBalance: response.data[account.currency.slug]
                            ? +account.balance.amount *
                              response.data[account.currency.slug].eur
                            : 0,
                        allocation: 0,
                        slug: account.currency.slug,
                    };
                    walletTotalFiat += accountOnHand.fiatBalance;
                    return accountOnHand;
                });
                mappedCoinbaseAccounts.sort((account1, account2) => {
                    return account2.fiatBalance - account1.fiatBalance;
                });
                if (walletTotalFiat > 0) {
                    mappedCoinbaseAccounts.forEach((account) => {
                        if (account.fiatBalance > 0) {
                            account.allocation =
                                (account.fiatBalance / walletTotalFiat) * 100;
                        }
                    });
                }
                return res.status(200).json({
                    walletTotalFiat,
                    accounts: mappedCoinbaseAccounts,
                });
            },
            (error) => {
                console.log("error");
            }
        );
};

interface CoinbaseAccount {
    accountId: string;
    code: string;
    name: string;
    color: string;
    assetId: string;
    balance: number;
    fiatBalance: number;
    slug: string;
    allocation: number;
}

export const getCoinbaseTransactionsForAccount: RequestHandler = async (
    req,
    res,
    next
) => {
    return axios
        .get(
            `https://api.coinbase.com/v2/accounts/${req.params.accountId}/buys`,
            {
                headers: {
                    Authorization: `Bearer ${req.headers["coinbaseaccesstoken"]}`,
                },
            }
        )
        .then(
            (response) => {
                console.log(response.data);
                return res.status(200).json(response.data.data);
            },
            (error) => {
                return res.status(error.response.status).send();
            }
        );
};
