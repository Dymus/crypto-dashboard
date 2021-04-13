import axios from "axios";
import { RequestHandler } from "express";
import { geminiGet } from "../request-helpers/gemini-request-helper";
import { RequestError } from "../types/RequestError";
import { validationResult } from "express-validator";
import moment from "moment";

export const getGeminiAvailableBalances: RequestHandler = (req, res, next) => {
  return geminiGet('account-v0HhqXlhJ4ZUUvTvo5C1', '3DKAJxk2kPpgv12GGndDZBBdtqM1', 'balances', JSON.stringify({ nonce: Date.now(), request: "/v1/balances" }))
    .then(async (geminiUsdResponse) => {
      const dollarAccount = geminiUsdResponse.data.find((account) => account.currency === "USD")
      const euroWallet = { balance: 0 }
      if (dollarAccount) {
        await axios.get("https://api.ratesapi.io/api/latest?base=USD&symbols=EUR").then((response) => {
          euroWallet.balance = dollarAccount.amount * response.data.rates.EUR
        })
      }
      return res.status(200).json({ accounts: geminiUsdResponse.data, euroWallet })
    }).catch((error) => {
      console.log(error)
      throw new RequestError(500, 'Fatal Gemini Error', 'There was an error while accessing your Gemini balances. If this error persist, try updating your API keys.');
    })
}

export const getGeminiTradesForAccount: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
      return next(
          new RequestError(422, 'Invalid input', validationResult(req).array().map((error) => error.msg).join(". "), validationResult(req).array())
      );
    }

  if (req.params.currencyCode.toLowerCase() === "eth" || req.params.currencyCode.toLowerCase() === "btc") {
    return Promise.all([
      geminiGet('account-v0HhqXlhJ4ZUUvTvo5C1', '3DKAJxk2kPpgv12GGndDZBBdtqM1', 'mytrades', JSON.stringify({ nonce: Date.now(), request: "/v1/mytrades", symbol: `${req.params.currencyCode.toLowerCase()}eur` })),
      geminiGet('account-v0HhqXlhJ4ZUUvTvo5C1', '3DKAJxk2kPpgv12GGndDZBBdtqM1', 'mytrades', JSON.stringify({ nonce: Date.now(), request: "/v1/mytrades", symbol: `${req.params.currencyCode.toLowerCase()}usd` }))
    ]).then(async ([geminiEurResponse, geminiUsdResponse]) => {     
      const orderDates = [];
      const exchangeRates = {};
      for (const trade of geminiUsdResponse.data) {
        let date = moment.unix(trade.timestamp).format('YYYY-MM-DD');
        if (!orderDates.some(order => order.date === date)) {
          orderDates.push({ orderId: trade.order_id, date });
          exchangeRates[trade.order_id] = axios.get(`https://api.ratesapi.io/api/${date}?base=USD&symbols=EUR`);
        } else {
          exchangeRates[trade.order_id] = exchangeRates[orderDates.find(orderDate => orderDate.date === date).orderId]
        }
      }

      for (const orderId in exchangeRates) {
        exchangeRates[orderId] = (await exchangeRates[orderId]).data.rates.EUR
      }
      
      const orders = {};
      for (let i = 0; i < geminiUsdResponse.data.length; i++) {
        const exchangeRate = exchangeRates[geminiUsdResponse.data[i].order_id]
        if (geminiUsdResponse.data[i].order_id in orders) {
          orders[geminiUsdResponse.data[i].order_id].orderAmount += +geminiUsdResponse.data[i].amount;
          orders[geminiUsdResponse.data[i].order_id].orderFiatAmount += (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price + +geminiUsdResponse.data[i].fee_amount) * exchangeRate; // MULTIPLY ORDER_FIAT_AMOUNT BY EUR EXCHANGE RATE
        } else {
          orders[geminiUsdResponse.data[i].order_id] = {
            orderDate: geminiUsdResponse.data[i].timestamp,
            orderType: `USD ${geminiUsdResponse.data[i].type}`,
            orderAmount: +geminiUsdResponse.data[i].amount,
            orderFiatAmount: (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price + +geminiUsdResponse.data[i].fee_amount) * exchangeRate,
          }
        }
      }

      for (let i = 0; i < geminiEurResponse.data.length; i++) {
        if (geminiEurResponse.data[i].order_id in orders) {
          orders[geminiEurResponse.data[i].order_id].orderAmount += +geminiEurResponse.data[i].amount;
          orders[geminiEurResponse.data[i].order_id].orderFiatAmount += +geminiEurResponse.data[i].amount * +geminiEurResponse.data[i].price + +geminiEurResponse.data[i].fee_amount
        } else {
          orders[geminiEurResponse.data[i].order_id] = {
            orderDate: geminiEurResponse.data[i].timestamp,
            orderType: `EUR ${geminiEurResponse.data[i].type}`,
            orderAmount: +geminiEurResponse.data[i].amount,
            orderFiatAmount: +geminiEurResponse.data[i].amount * +geminiEurResponse.data[i].price + +geminiEurResponse.data[i].fee_amount
          }
        }
      }        
      
      const mappedTransactions = []
      for (const orderId in orders) {
        mappedTransactions.push({
          transactionId: orderId,
          transactionDate: new Date(orders[orderId].orderDate * 1000).toISOString(),
          transactionType: orders[orderId].orderType,
          transactionStatus: "completed",
          transactionAmount: orders[orderId].orderType.split(" ")[1] === "Buy" ? orders[orderId].orderAmount.toFixed(6).toString() : `-${orders[orderId].orderAmount.toFixed(6)}`,
          transactionCurrency: req.params.currencyCode.toUpperCase(),
          transactionFiatAmount: orders[orderId].orderType.split(" ")[1] === "Buy" ? orders[orderId].orderFiatAmount.toFixed(2).toString() : `-${orders[orderId].orderFiatAmount.toFixed(2)}`,
          transactionFiatCurrency: "USD",
          transactionTitle: "On Gemini Exchange" 
        })
      }
      
      return res.status(200).json({ transactions: mappedTransactions });
      
    },
      () => {
        throw next(new RequestError(404, 'Internal Server Error', 'Could not find your Gemini wallet transactions. This is most likely an internal error, please contact the support.'));
      });
  }
  else {
    return geminiGet('account-v0HhqXlhJ4ZUUvTvo5C1', '3DKAJxk2kPpgv12GGndDZBBdtqM1', 'mytrades', JSON.stringify({ nonce: Date.now(), request: "/v1/mytrades", symbol: `${req.params.currencyCode.toLowerCase()}usd` }))
      .then(async (geminiUsdResponse) => {
        const orderDates = [];
        const exchangeRates = {};
        for (const trade of geminiUsdResponse.data) {
          let date = moment.unix(trade.timestamp).format('YYYY-MM-DD');
          if (!orderDates.some(order => order.date === date)) {
            orderDates.push({ orderId: trade.order_id, date });
            exchangeRates[trade.order_id] = axios.get(`https://api.ratesapi.io/api/${date}?base=USD&symbols=EUR`);
          } else {
            exchangeRates[trade.order_id] = exchangeRates[orderDates.find(orderDate => orderDate.date === date).orderId]
          }
        }
  
        for (const orderId in exchangeRates) {
          exchangeRates[orderId] = (await exchangeRates[orderId]).data.rates.EUR
        }
        
        const orders = {};
        for (let i = 0; i < geminiUsdResponse.data.length; i++) {
          const exchangeRate = exchangeRates[geminiUsdResponse.data[i].order_id]
          if (geminiUsdResponse.data[i].order_id in orders) {
            orders[geminiUsdResponse.data[i].order_id].orderAmount += +geminiUsdResponse.data[i].amount;
            orders[geminiUsdResponse.data[i].order_id].orderFiatAmount += (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price + +geminiUsdResponse.data[i].fee_amount) * exchangeRate; // MULTIPLY ORDER_FIAT_AMOUNT BY EUR EXCHANGE RATE
          } else {
            orders[geminiUsdResponse.data[i].order_id] = {
              orderDate: geminiUsdResponse.data[i].timestamp,
              orderType: `USD ${geminiUsdResponse.data[i].type}`,
              orderAmount: +geminiUsdResponse.data[i].amount,
              orderFiatAmount: (+geminiUsdResponse.data[i].amount * +geminiUsdResponse.data[i].price + +geminiUsdResponse.data[i].fee_amount) * exchangeRate,
            }
          }
        }
      
        const mappedTransactions = []
        for (const orderId in orders) {

          mappedTransactions.push({
            transactionId: orderId,
            transactionDate: new Date(orders[orderId].orderDate * 1000).toISOString(),
            transactionType: orders[orderId].orderType,
            transactionStatus: "completed",
            transactionAmount: orders[orderId].orderType.split(" ")[1] === "Buy" ? orders[orderId].orderAmount.toString() : `-${orders[orderId].orderAmount}`,
            transactionCurrency: req.params.currencyCode.toUpperCase(),
            transactionFiatAmount: orders[orderId].orderType.split(" ")[1] === "Buy" ? orders[orderId].orderFiatAmount.toString() : `-${orders[orderId].orderFiatAmount}`,
            transactionFiatCurrency: "USD",
            transactionTitle: "On Gemini Exchange"
          })
        }
        return res.status(200).json({ transactions: mappedTransactions });
      },
        () => {
          throw next(new RequestError(404, 'Internal Server Error', 'Could not find your Gemini wallet transactions. This is most likely an internal error, please contact the support.'));
        }
    ).catch(error => {
        throw next(new RequestError(404, 'Internal Server Error', 'Could not find your Gemini wallet transactions. This is most likely an internal error, please contact the support.'));
    })
  }
};