import { RequestHandler } from 'express';
import { RequestError } from '../types/RequestError';
import { coinbaseGet } from '../request-helpers/coinbase-request-helper';

// tested in the api-coinbase-controller test suite
export const getCoinbaseWallet: RequestHandler = async (req, res, next) => {
  try {
    const userResponse = await coinbaseGet('https://api.coinbase.com/v2/user', req.user);
    const walletAccountsResponse = await coinbaseGet('https://api.coinbase.com/v2/accounts?limit=99', req.user);
    let walletAccounts = walletAccountsResponse.data.data.map((account) => {
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
    let euroWallet;
    walletAccounts = walletAccounts.filter((account) => {
      if (account.type !== 'fiat') return true;
      else euroWallet = account;
    });
    return res.status(200).json({ walletAccounts, euroWallet, createdAt: Date.parse(userResponse.data.data.created_at) });
  } catch {
    next(
      new RequestError(
        404,
        'Internal Server Error',
        'Could not find your Coinbase wallet. This is most likely an internal error, please contact the support.',
      ),
    );
  }
};

export const getCoinbaseTransactionsForAccount: RequestHandler = async (req, res, next) => {
  try {
    const transactionsResponse = await coinbaseGet(
      `https://api.coinbase.com/v2/accounts/${req.params.accountId}/transactions`,
      req.user,
    );
    const mappedTransactions = transactionsResponse.data.data
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
  } catch {
    next(
      new RequestError(
        404,
        'Internal Server Error',
        'Could not find your Coinbase wallet transactions. This is most likely an internal error, please contact the support.',
      ),
    );
  }
};

export const getCoinbasePortfolioPerformance: RequestHandler = async (req, res, next) => {
  try {
    const portfolioPerformanceResponse = await coinbaseGet(
      'https://www.coinbase.com/api/v3/coinbase.public_api.authed.portfolio_performance.PerformanceCalculator/Calculate?q=eyJkaXNwbGF5Q3VycmVuY3kiOiJFVVIiLCJwZXJpb2QiOiJVTktOT1dOIn0%3D',
      req.user,
    );
    return res.status(200).json(portfolioPerformanceResponse.data);
  } catch {
    next(
      new RequestError(
        404,
        'Internal Server Error',
        'Could not find your Coinbase portfolio data. This is most likely an internal error, please contact the support.',
      ),
    );
  }
};
