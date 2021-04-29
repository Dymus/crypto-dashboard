import cryptoJs from 'crypto-js';
import { CoinbaseAccessToken, User, UserModel } from '../models/user-model';

export const createUser = async (user: User) => {
  return UserModel.create(user)
    .then((createdUser) =>
      createdUser ? Promise.resolve(createdUser) : Promise.reject()
  )
    .catch(() => { return Promise.reject() })
};

export const getUser = async (email: string) => {
  return UserModel.findOne({ email })
    .then((user) =>
      user ? Promise.resolve(user) : Promise.reject()
  )
    .catch(() => { return Promise.reject() })
};

export const getUserById = async (userId: string) => {
  return UserModel.findById(userId)
    .then((user) =>
      user ? Promise.resolve(user) : Promise.reject()
  )
    .catch(() => { return Promise.reject() })
};

export const saveCoinbaseTokens = async (
  userId: string,
  newCoinbaseTokens: CoinbaseAccessToken
) => {
  return UserModel.findById(userId).then((user) => {
    user.coinbaseTokens = {
      access_token: newCoinbaseTokens.access_token,
      refresh_token: cryptoJs.AES.encrypt(
        newCoinbaseTokens.refresh_token,
        user.password
      ).toString(),
    };
    return user.save();
  })
    .catch(() => { return Promise.reject() })
};

export const setGeminiApiKeys = async (userId: string, apiKey: string, apiSecret: string) => {
  return UserModel.findById(userId).then((user) => {
    user.geminiKeys = {
      apiKey,
      apiSecret: cryptoJs.AES.encrypt(
        apiSecret,
        user.password
      ).toString(),
    };
    return user.save();
  })
    .catch(() => { return Promise.reject() })
};

export const setUserAlertsInUserDB = async (userId: string, alerts) => {
  return UserModel.findByIdAndUpdate({ _id: userId }, { alerts }, { new: true })
    .then((updatedUser) => {
      return Promise.resolve(updatedUser);
    })
    .catch(() => { return Promise.reject() })
}

export const getUserAlertNotificationsFromUserDB = async (userId: string) => {
  return UserModel.findById(userId).select('notifications').then((userWithNotifications) => {
    return Promise.resolve(userWithNotifications.notifications)
  })
    .catch(() => { return Promise.reject() })
}

export const markAllUserAlertNotificationsAsViewedInUserDB = async (userId: string) => {
  return UserModel.findById(userId).select('notifications')
    .then((userWithNotifications) => {
      userWithNotifications.notifications.forEach((notification) => {
        notification.wasViewed = true;
      })
      return userWithNotifications.save()
    })
    .then((updatedUser) => {
      return Promise.resolve(updatedUser)
    })
    .catch(() => { return Promise.reject() })
}

export const removeAllAlertNotificationsFromUserDB = async (userId: string) => {
  return UserModel.findByIdAndUpdate(userId, { notifications: [] }, { new: true })
    .then((updatedUser) => {
      return updatedUser.notifications.length === 0 ? Promise.resolve() : Promise.reject()
    })
    .catch(() => { return Promise.reject() })
}
