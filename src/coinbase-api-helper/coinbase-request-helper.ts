import axios from "axios";
import { saveCoinbaseTokens } from "../database/userDB";
import { CoinbaseAccessToken } from "../models/user-model";

export const coinbaseGet = (url: string, coinbaseTokens: CoinbaseAccessToken, userId: string) => {
  return axios.get(url, { headers: { "Authorization": `Bearer ${coinbaseTokens.access_token}` } })
    .then(
      (response) => { return Promise.resolve(response) },
      async (error) => {
        if (error.response.data.errors[0].id === "expired_token") {
          const token = await axios.post(`https://api.coinbase.com/oauth/token?grant_type=authorization_code&client_id=${process.env.COINBASE_CLIENT_ID}&client_secret=${process.env.COINBASE_CLIENT_SECRET}&refresh_token=${coinbaseTokens.refresh_token}`)
          const user = await saveCoinbaseTokens(userId, { access_token: token.data.access_token, refresh_token: token.data.refresh_token })
          if (user.coinbaseTokens) {
            error.config.headers.Authorization = `Bearer ${user.coinbaseTokens.access_token}`;
            return axios.request(error.config);
          }
        } else {
          return Promise.reject(error);
        }
      }
    )
}