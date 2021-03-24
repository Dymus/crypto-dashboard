import axios from "axios";
import { saveCoinbaseTokens } from "../database/userDB";
import cryptoJs from 'crypto-js';

export const coinbaseGet = (url: string, user: any) => {
  return axios.get(url, { headers: { "Authorization": `Bearer ${user.coinbaseTokens.access_token}` } })
    .then(
      (response) => { return Promise.resolve(response) },
      (error) => {
        if (error.response.data.errors[0].id === "expired_token") {
          axios.post(`https://api.coinbase.com/oauth/token?grant_type=refresh_token&client_id=${process.env.COINBASE_CLIENT_ID}&client_secret=${process.env.COINBASE_CLIENT_SECRET}&refresh_token=${cryptoJs.AES.decrypt(user.coinbaseTokens.refresh_token, user.password).toString(cryptoJs.enc.Utf8)}`)
            .then((tokenResponse) => {
              saveCoinbaseTokens(user._id, { access_token: tokenResponse.data.access_token, refresh_token: tokenResponse.data.refresh_token })
                .then((savedUser) => {
                  if (savedUser.coinbaseTokens) {
                    error.config.headers.Authorization = `Bearer ${savedUser.coinbaseTokens.access_token}`;
                    return axios.request(error.config);
                  }
                })
            })
        } else {
          return Promise.reject(error);
        }
      }
  ).catch((error) => {
    console.log(error)
    return Promise.reject(error)
  })
}