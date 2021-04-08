import axios from "axios";
import { RequestHandler } from "express";
import { geminiPost } from "../request-helpers/gemini-request-helper";

export const getGeminiAvailableBalances: RequestHandler = (req, res, next) => {
  return geminiPost('account-9hQquRvITHlUdbDBrljP', '35fiNpTrzw61XYLXZCE93dJwuojj', 'balances', JSON.stringify({ nonce: Date.now(), request: "/v1/balances" }))
    .then(async (geminiResponse) => {
      const dollarAccount = geminiResponse.data.find((account) => account.currency === "USD")
      const euroWallet = { balance: 0 }
      if (dollarAccount) {
        await axios.get("https://api.ratesapi.io/api/latest?base=USD&symbols=EUR").then((response) => {
          euroWallet.balance = dollarAccount.amount * response.data.rates.EUR
        })
      }
      return res.status(200).json({ accounts: geminiResponse.data, euroWallet })
    })
}