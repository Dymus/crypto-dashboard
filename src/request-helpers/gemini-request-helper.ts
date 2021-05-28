import axios from 'axios';
import CryptoJS from 'crypto-js';

const geminiAxiosInstance = axios.create({ baseURL: 'https://api.sandbox.gemini.com/v1' });

export const geminiGet = async (apiKey: string, apiSecret: string, url: string, payload?: any, ...args: any[]) => {
    const encodedPayload = new Buffer(payload).toString('base64');
    return geminiAxiosInstance.post(url, null, {
      headers: {
        'X-GEMINI-APIKEY': apiKey,
        'X-GEMINI-PAYLOAD': encodedPayload,
        'X-GEMINI-SIGNATURE': CryptoJS.HmacSHA384(encodedPayload, apiSecret).toString(CryptoJS.enc.Hex),
      },
    });
};
