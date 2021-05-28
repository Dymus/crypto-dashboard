import cryptoJs from 'crypto-js';
import { CoinbaseAccessToken, User, UserModel } from '../models/user-model';

// tested in the userDB test suite
export const createUser = async (user: User) => {
  return UserModel.create(user)
    .then((createdUser) => {
      if (createdUser) return createdUser;
      else throw new Error();
    })
};

// tested in the userDB test suite
export const getUser = async (email: string) => {
  return UserModel.findOne({ email })
    .then((user) => {
      if (user) return user;
      else throw new Error('No user with this email')
    })
};

// ested in the userDB test suite
export const getUserById = async (userId: string, options?) => {
  return UserModel.findById(userId, options)
    .then((user) => {
      if (user) return user;
      else throw new Error('No user with this ID')
    })
};

// tested as a part of the refreshJWT method
export const getUserTokenDataById = async (userId: string) => {
  return UserModel.findById(userId)
    .select(['email', 'coinbaseTokens', 'geminiKeys'])
    .then((user) => {
      if (user) return user;
      else throw new Error('No user with this ID')
    })
};

// tested in the userDB test suite
export const saveCoinbaseTokens = async (userId: string, newCoinbaseTokens: CoinbaseAccessToken) => {
  return UserModel.findById(userId)
    .then((user) => {
      user.coinbaseTokens = {
        access_token: newCoinbaseTokens.access_token,
        refresh_token: cryptoJs.AES.encrypt(newCoinbaseTokens.refresh_token, user.password).toString(),
      };
      return user.save();
    })
    .then((savedUser) => {
      if (savedUser.coinbaseTokens.access_token === newCoinbaseTokens.access_token) return savedUser;
      else throw new Error('Failed to save Coinbase tokens')
    })
};

// tested in the userDB test suite
export const setGeminiApiKeys = async (userId: string, apiKey: string, apiSecret: string) => {
  return UserModel.findById(userId)
    .then((user) => {
      user.geminiKeys = {
        apiKey,
        apiSecret: cryptoJs.AES.encrypt(apiSecret, user.password).toString(),
      };
      return user.save();
    })
    .then((savedUser) => {
      if (savedUser.geminiKeys.apiKey === apiKey) return savedUser;
      else throw new Error('Failed to save Gemini keys')
    })
};

// tested in the userDB test suite
export const setUserAlertsInUserDB = async (userId: string, alerts) => {
  return UserModel.findByIdAndUpdate(userId, { alerts }, { new: true })
    .then((updatedUser) => {
      if (updatedUser) return updatedUser;
      else throw new Error('Failed to set user alerts')
    })
};

// tested in the userDB test suite
export const getUserAlertNotificationsFromUserDB = async (userId: string) => {
  return UserModel.findById(userId)
    .select('notifications')
    .then((userWithNotifications) => {
      if (userWithNotifications) return userWithNotifications.notifications
      else throw new Error('Failed to get user\'s alert notifications')
    })
};

// tested in the userDB test suite
export const markAllUserAlertNotificationsAsViewedInUserDB = async (userId: string) => {
  return UserModel.findById(userId)
    .then((foundUser) => {
      foundUser.notifications.forEach((notification) => {
        notification.wasViewed = true;
      });
      return foundUser.save()
    })
    .then((updatedUser) => {
      if (updatedUser) return updatedUser;
      else throw new Error('Failed to mark all user\'s alert notifications as viewed')
    })
};

// tested in the userDB test suite
export const removeAllAlertNotificationsFromUserDB = async (userId: string) => {
  return UserModel.findByIdAndUpdate(userId, { notifications: [] }, { new: true })
    .then((updatedUser) => {
      if(updatedUser.notifications.length === 0) return updatedUser;
      else throw new Error('Failed to remove all user\'s alert notifications')
    })
};
