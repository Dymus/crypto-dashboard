import axios from "axios";
import { RequestHandler } from "express";
import { geminiPost } from "../request-helpers/gemini-request-helper";
import { RequestError } from "../types/RequestError";

export const getGeminiAvailableBalances: RequestHandler = (req, res, next) => {
  return geminiPost('account-v0HhqXlhJ4ZUUvTvo5C1', '3DKAJxk2kPpgv12GGndDZBBdtqM1', 'balances', JSON.stringify({ nonce: Date.now(), request: "/v1/balances" }))
    .then(async (geminiResponse) => {
      const dollarAccount = geminiResponse.data.find((account) => account.currency === "USD")
      const euroWallet = { balance: 0 }
      if (dollarAccount) {
        await axios.get("https://api.ratesapi.io/api/latest?base=USD&symbols=EUR").then((response) => {
          euroWallet.balance = dollarAccount.amount * response.data.rates.EUR
        })
      }
      return res.status(200).json({ accounts: geminiResponse.data, euroWallet })
    }).catch((error) => {
      console.log(error)
      throw new RequestError(500, 'Fatal Gemini Error', 'There was an error while accessing your Gemini balances. If this error persist, try updating your API keys.');
    })
}