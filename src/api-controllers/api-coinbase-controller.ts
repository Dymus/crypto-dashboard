import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { coinbaseGet } from '../request-helpers/coinbase-request-helper';

export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
  return coinbaseGet('https://api.coinbase.com/v2/user', req.user)
    .then(
      (userResponse) => {
        coinbaseGet('https://api.coinbase.com/v2/accounts?limit=99', req.user).then(
          (walletAccountsResponse) => {
            const walletAccounts = walletAccountsResponse.data.data.map((account) => {
              return {
                coinbaseAccountId: account.id,
                type: account.type,
                code: account.currency.code,
                name: account.currency.name,
                color: account.currency.color,
                balance: +account.balance.amount,
                slug: account.currency.slug,
                createdAt: Date.parse(account.created_at),
              };
            });
            const euroWallet = walletAccounts.splice(
              walletAccounts.findIndex((account) => account.type === 'fiat'),
              1
            )[0];
            return res
              .status(200)
              .json({ walletAccounts, euroWallet, createdAt: Date.parse(userResponse.data.data.created_at) });
          },
          () => {
            throw next(
              new RequestError(
                404,
                'Internal Server Error',
                'Could not find your Coinbase wallet. This is most likely an internal error, please contact the support.'
              )
            );
          }
        );
      },
      () => {
        throw next(
          new RequestError(
            404,
            'Internal Server Error',
            'Could not find your Coinbase wallet. This is most likely an internal error, please contact the support.'
          )
        );
      }
    )
    .catch((internalError) => {
      throw next(internalError);
    });
};

export const getCoinbaseTransactionsForAccount: RequestHandler = async (req, res, next) => {
  coinbaseGet(`https://api.coinbase.com/v2/accounts/${req.params.accountId}/transactions`, req.user).then(
    (response) => {
      const mappedTransactions = response.data.data
        .map((transaction) => {
          return {
            transactionId: transaction.id, // order_id
            transactionDate: transaction.created_at, // timestamp
            transactionType: transaction.type, // type
            transactionStatus: transaction.status, // "completed"
            transactionAmount: transaction.amount.amount, // aggregated amount for all with the same order_id
            transactionCurrency: transaction.amount.currency, // part of the symbol
            transactionFiatAmount: transaction.native_amount.amount, // aggregated amount+fee_amount but in eur for all with the same order_id
            transactionFiatCurrency: transaction.native_amount.currency, // EUR
            transactionTitle: transaction.details.title, // on exchange = "on gemini"
          };
        })
        .reverse();
      return res.status(200).json({ transactions: mappedTransactions });
    },
    () => {
      throw next(
        new RequestError(
          404,
          'Internal Server Error',
          'Could not find your Coinbase wallet transactions. This is most likely an internal error, please contact the support.'
        )
      );
    }
  );
};

export const getCoinbasePortfolioPerformance: RequestHandler = async (req, res, next) => {
  coinbaseGet(
    'https://www.coinbase.com/api/v3/coinbase.public_api.authed.portfolio_performance.PerformanceCalculator/Calculate?q=eyJkaXNwbGF5Q3VycmVuY3kiOiJFVVIiLCJwZXJpb2QiOiJVTktOT1dOIn0%3D',
    req.user
  ).then(
    (response) => {
      return res.status(200).json(response.data);
    },
    () => {
      throw next(
        new RequestError(
          404,
          'Internal Server Error',
          'Could not find your Coinbase portfolio data. This is most likely an internal error, please contact the support.'
        )
      );
    }
  );
};
