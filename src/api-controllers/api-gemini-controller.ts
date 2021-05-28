import { RequestHandler } from 'express';
import axios from 'axios';
import moment from 'moment';

import { geminiGet } from '../request-helpers/gemini-request-helper';
import { RequestError } from '../types/RequestError';

// tested in the api-gemini-controller test suite
export const getGeminiAvailableBalances: RequestHandler = async (req, res, next) => {
  try {
    const geminiBalancesResponse = await geminiGet(
      req.user.geminiKeys.apiKey,
      req.geminiSecret,
      'balances',
      JSON.stringify({ nonce: Date.now(), request: '/v1/balances' })
    );
    const geminiAccountResponse = await geminiGet(
      req.user.geminiKeys.apiKey,
      req.geminiSecret,
      'account',
      JSON.stringify({ nonce: Date.now(), request: '/v1/account' })
    );
    const dollarAccount = geminiBalancesResponse.data.find((account) => account.currency === 'USD');
    const euroWallet = { balance: 0 };
    if (dollarAccount) {
      const exchangeRatesResponse = await axios.get('https://api.exchangerate.host/latest?base=USD&symbols=EUR');
      euroWallet.balance = dollarAccount.amount * exchangeRatesResponse.data.rates.EUR;
    }
    return res.status(200).json({
      accounts: geminiBalancesResponse.data,
      euroWallet,
      createdAt: geminiAccountResponse.data.account.created,
    });
  } catch (error) {
    if (error.response.data.reason === 'InvalidSignature') {
      next(
        new RequestError(
          401,
          'Gemini Authentication Error',
          'The Gemini API keys you provided seem to be invalid. Please check if you inserted the correct ones and retry.'
        )
      );
    } else {
      next(
        new RequestError(
          400,
          'Fatal Gemini Error',
          'There was an error while accessing your Gemini balances. If this error persist, try updating your API keys.'
        )
      );
    }
  }
};

// tested in the api-gemini-controller test suite
export const getGeminiTradesForAccount: RequestHandler = async (req, res, next) => {
  try {
    if (req.params.currencyCode.toLowerCase() === 'eth' || req.params.currencyCode.toLowerCase() === 'btc') {
      const geminiUsdResponseBody = (await geminiGet(
        req.user.geminiKeys.apiKey,
        req.geminiSecret,
        'mytrades',
        JSON.stringify({
          nonce: Date.now(),
          request: '/v1/mytrades',
          symbol: `${req.params.currencyCode.toLowerCase()}eur`,
        })
      )).data
      const geminiEurResponseBody = (await geminiGet(
        req.user.geminiKeys.apiKey,
        req.geminiSecret,
        'mytrades',
        JSON.stringify({
          nonce: Date.now(),
          request: '/v1/mytrades',
          symbol: `${req.params.currencyCode.toLowerCase()}usd`,
        })
      )).data
      const orderDates = [];
      const exchangeRates = {};
      const orders = {};

      for (const trade of geminiUsdResponseBody) {
        const date = moment.unix(trade.timestamp).format('YYYY-MM-DD');
        if (!orderDates.some((order) => order.date === date)) {
          orderDates.push({ orderId: trade.order_id, date });
          exchangeRates[trade.order_id] = axios.get(`https://api.exchangerate.host/${date}?base=USD&symbols=EUR`);
        } else {
          exchangeRates[trade.order_id] =
            exchangeRates[orderDates.find((orderDate) => orderDate.date === date).orderId];
        }
      }

      for (const orderId in exchangeRates) {
        exchangeRates[orderId] = (await exchangeRates[orderId]).data.rates.EUR;
      }

      for (let i = 0; i < geminiUsdResponseBody.length; i++) {
        const exchangeRate = exchangeRates[geminiUsdResponseBody[i].order_id];
        if (geminiUsdResponseBody[i].order_id in orders) {
          orders[geminiUsdResponseBody[i].order_id].orderAmount += +geminiUsdResponseBody[i].amount;
          orders[geminiUsdResponseBody[i].order_id].orderFiatAmount +=
            (+geminiUsdResponseBody[i].amount * +geminiUsdResponseBody[i].price +
              +geminiUsdResponseBody[i].fee_amount) *
            exchangeRate;
        } else {
          orders[geminiUsdResponseBody[i].order_id] = {
            orderDate: geminiUsdResponseBody[i].timestamp,
            orderType: `USD ${geminiUsdResponseBody[i].type}`,
            orderAmount: +geminiUsdResponseBody[i].amount,
            orderFiatAmount:
              (+geminiUsdResponseBody[i].amount * +geminiUsdResponseBody[i].price +
                +geminiUsdResponseBody[i].fee_amount) *
              exchangeRate,
          };
        }
      }

      for (let i = 0; i < geminiEurResponseBody.length; i++) {
        if (geminiEurResponseBody[i].order_id in orders) {
          orders[geminiEurResponseBody[i].order_id].orderAmount += +geminiEurResponseBody[i].amount;
          orders[geminiEurResponseBody[i].order_id].orderFiatAmount +=
            +geminiEurResponseBody[i].amount * +geminiEurResponseBody[i].price + +geminiEurResponseBody[i].fee_amount;
        } else {
          orders[geminiEurResponseBody[i].order_id] = {
            orderDate: geminiEurResponseBody[i].timestamp,
            orderType: `EUR ${geminiEurResponseBody[i].type}`,
            orderAmount: +geminiEurResponseBody[i].amount,
            orderFiatAmount:
              +geminiEurResponseBody[i].amount * +geminiEurResponseBody[i].price + +geminiEurResponseBody[i].fee_amount,
          };
        }
      }

      const mappedTransactions = [];
      for (const orderId in orders) {
        mappedTransactions.push({
          transactionId: orderId,
          transactionDate: new Date(orders[orderId].orderDate * 1000).toISOString(),
          transactionType: orders[orderId].orderType,
          transactionStatus: 'completed',
          transactionAmount:
            orders[orderId].orderType.split(' ')[1] === 'Buy'
              ? orders[orderId].orderAmount.toFixed(6).toString()
              : `-${orders[orderId].orderAmount.toFixed(6)}`,
          transactionCurrency: req.params.currencyCode.toUpperCase(),
          transactionFiatAmount:
            orders[orderId].orderType.split(' ')[1] === 'Buy'
              ? orders[orderId].orderFiatAmount.toFixed(2).toString()
              : `-${orders[orderId].orderFiatAmount.toFixed(2)}`,
          transactionFiatCurrency: 'USD',
          transactionTitle: 'On Gemini Exchange',
        });
      }

      return res.status(200).json({ transactions: mappedTransactions });
    } else {
      const geminiUsdResponse = await geminiGet(
        req.user.geminiKeys.apiKey,
        req.geminiSecret,
        'mytrades',
        JSON.stringify({
          nonce: Date.now(),
          request: '/v1/mytrades',
          symbol: `${req.params.currencyCode.toLowerCase()}usd`,
        })
      );

      const orderDates = [];
      const exchangeRates = {};
      const orders = {};
      for (const trade of geminiUsdResponse.data) {
        const date = moment.unix(trade.timestamp).format('YYYY-MM-DD');
        if (!orderDates.some((order) => order.date === date)) {
          orderDates.push({ orderId: trade.order_id, date });
          exchangeRates[trade.order_id] = axios.get(`https://api.exchangerate.host/${date}?base=USD&symbols=EUR`);
        } else {
          exchangeRates[trade.order_id] =
            exchangeRates[orderDates.find((orderDate) => orderDate.date === date).orderId];
        }
      }

      for (const orderId in exchangeRates) {
        exchangeRates[orderId] = (await exchangeRates[orderId]).data.rates.EUR;
      }

      for (let i = 0; i < geminiUsdResponse.data.length; i++) {
        const exchangeRate = exchangeRates[geminiUsdResponse.data[i].order_id];
        if (geminiUsdResponse.data[i].order_id in orders) {
          orders[geminiUsdResponse.data[i].order_id].orderAmount += +geminiUsdResponse.data[i].amount;
          orders[geminiUsdResponse.data[i].order_id].orderFiatAmount +=
            (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price +
              +geminiUsdResponse.data[i].fee_amount) *
            exchangeRate;
        } else {
          orders[geminiUsdResponse.data[i].order_id] = {
            orderDate: geminiUsdResponse.data[i].timestamp,
            orderType: `USD ${geminiUsdResponse.data[i].type}`,
            orderAmount: +geminiUsdResponse.data[i].amount,
            orderFiatAmount:
              (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price +
                +geminiUsdResponse.data[i].fee_amount) *
              exchangeRate,
          };
        }
      }

      const mappedTransactions = [];
      for (const orderId in orders) {
        mappedTransactions.push({
          transactionId: orderId,
          transactionDate: new Date(orders[orderId].orderDate * 1000).toISOString(),
          transactionType: orders[orderId].orderType,
          transactionStatus: 'completed',
          transactionAmount:
            orders[orderId].orderType.split(' ')[1] === 'Buy'
              ? orders[orderId].orderAmount.toString()
              : `-${orders[orderId].orderAmount}`,
          transactionCurrency: req.params.currencyCode.toUpperCase(),
          transactionFiatAmount:
            orders[orderId].orderType.split(' ')[1] === 'Buy'
              ? orders[orderId].orderFiatAmount.toString()
              : `-${orders[orderId].orderFiatAmount}`,
          transactionFiatCurrency: 'USD',
          transactionTitle: 'On Gemini Exchange',
        });
      }
      return res.status(200).json({ transactions: mappedTransactions });
    }
  } catch (error) {
    if (error.response && error.response.data.reason === 'InvalidSignature') {
      next(
        new RequestError(
          401,
          'Gemini Authentication Error',
          'The Gemini API keys you provided seem to be invalid. Please check if you inserted the correct ones and retry.'
        )
      );
    } else if (error.response && error.response.data.reason === 'InvalidNonce') {
      next(
        new RequestError(
          400,
          'Gemini None Error',
          'There was an error on our side. To fix this, please upload new Gemini API keys and retry.'
        )
      );
    } else {
      next(
        new RequestError(
          400,
          'Internal Server Error',
          'Could not find your Gemini wallet transactions. This is most likely an internal error, please contact the support.'
        )
      );
    }
  }
};
