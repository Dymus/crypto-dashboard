import cryptoJs from "crypto-js";
import { CoinbaseAccessToken, User, UserModel } from "../models/user-model";

export const createUser = async (user: User) => {
  return UserModel.create(user).then((createdUser) =>
    createdUser ? Promise.resolve(createdUser) : Promise.reject()
  );
};

export const getUser = async (email: string) => {
  return UserModel.findOne({ email }).then((user) =>
    user ? Promise.resolve(user) : Promise.reject()
  );
};

export const saveCoinbaseTokens = async (userId: string, newCoinbaseTokens: CoinbaseAccessToken) => {
  return UserModel.findById(userId)
    .then(
      (user) => {
        user.coinbaseTokens = {
          access_token: newCoinbaseTokens.access_token,
          refresh_token: cryptoJs.AES.encrypt(
            newCoinbaseTokens.refresh_token,
            user.password
          ).toString(),
        };
        return user.save();
      })
}