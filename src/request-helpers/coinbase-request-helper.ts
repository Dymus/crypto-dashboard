import axios from 'axios';
import { saveCoinbaseTokens } from '../database/userDB';
import cryptoJs from 'crypto-js';

// tested partially by calling API points
export const coinbaseGet = async (url: string, user: any) => {
  try {
    const originalResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.coinbaseTokens.access_token}`,
        'Accept-Language': 'en',
        'Content-Type': 'application/json',
      },
    });
    return originalResponse;
  } catch (error) {
    if (error.response.data.errors[0].id === 'expired_token') {
      const coinbaseTokenResponse = await axios.post(
        `https://api.coinbase.com/oauth/token?grant_type=refresh_token&client_id=${
          process.env.COINBASE_CLIENT_ID
        }&client_secret=${process.env.COINBASE_CLIENT_SECRET}&refresh_token=${cryptoJs.AES.decrypt(
          user.coinbaseTokens.refresh_token,
          user.password,
        ).toString(cryptoJs.enc.Utf8)}`,
      );

      const savedUser = await saveCoinbaseTokens(user._id, {
        access_token: coinbaseTokenResponse.data.access_token,
        refresh_token: coinbaseTokenResponse.data.refresh_token,
      });
      if (savedUser.coinbaseTokens) {
        error.config.headers.Authorization = `Bearer ${savedUser.coinbaseTokens.access_token}`;
        const repeatedResponse = await axios.request(error.config);
        return repeatedResponse;
      }
    } else {
      throw error;
    }
  }
};

// tested partially by calling API points
export const revokeCoinbaseTokens = async (user: any) => {
  try {
    const response = await axios.post(
      'https://api.coinbase.com/oauth/revoke',
      { token: user.coinbaseTokens.access_token },
      {
        headers: {
          Authorization: `Bearer ${user.coinbaseTokens.access_token}`,
          'Accept-Language': 'en',
          'Content-Type': 'application/json',
        },
      },
    );
    return response;
  } catch (error) {
    if (error.response.data.errors[0].id === 'expired_token') {
      const coinbaseTokenResponse = await axios.post(
        `https://api.coinbase.com/oauth/token?grant_type=refresh_token&client_id=${
          process.env.COINBASE_CLIENT_ID
        }&client_secret=${process.env.COINBASE_CLIENT_SECRET}&refresh_token=${cryptoJs.AES.decrypt(
          user.coinbaseTokens.refresh_token,
          user.password,
        ).toString(cryptoJs.enc.Utf8)}`,
      );
      const savedUser = await saveCoinbaseTokens(user._id, {
        access_token: coinbaseTokenResponse.data.access_token,
        refresh_token: coinbaseTokenResponse.data.refresh_token,
      });
      if (savedUser.coinbaseTokens) {
        error.config.headers.Authorization = `Bearer ${savedUser.coinbaseTokens.access_token}`;
        const repeatedResponse = await axios.request(error.config);
        return repeatedResponse;
      }
    }
  }
};
