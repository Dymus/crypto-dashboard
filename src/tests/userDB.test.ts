import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

import {
  createUser,
  getUser,
  getUserById,
  markAllUserAlertNotificationsAsViewedInUserDB,
  removeAllAlertNotificationsFromUserDB,
  saveCoinbaseTokens,
  setGeminiApiKeys,
  setUserAlertsInUserDB,
} from '../database/userDB';
import { DocumentType } from '@typegoose/typegoose';
import { User, UserModel } from '../models/user-model';

let mongoose;
let testUser: DocumentType<User>;

beforeAll(async () => {
  const myEnv = config();
  dotenvExpand(myEnv);

  mongoose = await connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  testUser = await createUser({ email: 'test@test.test', password: 'aksmdkajsdkjeanda' });
});

/**
 * test createUser method
 */
test('create user with a correct user object', async () => {
  // act
  return createUser({ email: 'test2@test.test', password: 'aksmdkajsdkjeanda' }).then((newUser) => {
    // assert
    expect(newUser.email).toEqual('test2@test.test');
    expect(newUser.password).toEqual('aksmdkajsdkjeanda');
  });
});

test('fail to create user with null instead of a user object', async () => {
  // act
  return createUser(null).catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test getUser method
 */
test('get user with a correct email', async () => {
  // act
  return getUser('test@test.test').then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.email).toEqual('test@test.test');
  });
});

test('fail to get user with an incorrect email', async () => {
  // act
  return getUser('testss@test.test').catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test getUserById method
 */
test('get user with a correct id', async () => {
  // act
  return getUserById(testUser._id).then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user._id).toEqual(testUser._id);
  });
});

test('fail to get user with an incorrect id', async () => {
  // act
  return getUserById('7282999f7b7d21615c69ac0c').catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test saveCoinbaseTokens method
 */
test('save coinbase tokens when provided correct user ID', async () => {
  // act
  return saveCoinbaseTokens(testUser._id, { access_token: 'abcdEFGH', refresh_token: '12345678' }).then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.coinbaseTokens.access_token).toEqual('abcdEFGH');
  });
});

test('fail to save coinbase tokens when provided incorrect user ID', async () => {
  // act
  return saveCoinbaseTokens('608299af7bad21645c69ac0c', { access_token: 'abcdEFGH', refresh_token: '12345678' }).catch(
    (error) => {
      // assert
      expect(error).toBeInstanceOf(Error);
    },
  );
});

test('fail to save coinbase tokens when provided null as tokens', async () => {
  // act
  return saveCoinbaseTokens(testUser._id, null).catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test saveCoinbaseTokens method
 */
test('save gemini API keys when provided correct user ID', async () => {
  // act
  return setGeminiApiKeys(testUser._id, 'abcdEFGH', '12345678').then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.coinbaseTokens.access_token).toEqual('abcdEFGH');
  });
});

test('fail to save gemini API keys when provided incorrect user ID', async () => {
  // act
  return setGeminiApiKeys('608299af7bad21645c69ac0c', 'abcdEFGH', '12345678').catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

test('fail to save gemini API keys when provided null as keys', async () => {
  // act
  return setGeminiApiKeys(testUser._id, null, null).catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test setUserAlertsInUserDB method
 */
test("save user's alerts notifications when provided correct user ID", async () => {
  // act
  return setUserAlertsInUserDB(testUser._id, { alert1: 'test1' }).then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.alerts).toEqual({ alert1: 'test1' });
  });
});

test("fail to save user's alerts notifications when provided incorrect user ID", async () => {
  // act
  return setUserAlertsInUserDB('608299af7bad21645c69ac0c', { alert1: 'test1' }).catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * test markAllUserAlertNotificationsAsViewedInUserDB method
 */
test("mark all user's alert notifications as viewed when provided correct user ID", async () => {
  await UserModel.findByIdAndUpdate(testUser._id, {
    notifications: [
      {
        id: '9d170f47-3552-4607-9b66-00b363061c37',
        token: 'litecoin',
        createdAt: 1621714666221,
        iconUrl: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png?1547033580',
        title: 'Litecoin is going down',
        message: 'Hour price alert: Litecoin went down -0.27%',
        wasViewed: true,
        type: 'loss',
      },
    ],
  });

  // act
  return markAllUserAlertNotificationsAsViewedInUserDB(testUser._id).then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.notifications[0].wasViewed).toBe(true);
  });
});

/**
 * test removeAllAlertNotificationsFromUserDB method
 */
test("mark all user's alert notifications as viewed when provided correct user ID", async () => {
  await UserModel.findByIdAndUpdate(testUser._id, {
    notifications: [
      {
        id: '9d170f47-3552-4607-9b66-00b363061c37',
        token: 'litecoin',
        createdAt: 1621714666221,
        iconUrl: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png?1547033580',
        title: 'Litecoin is going down',
        message: 'Hour price alert: Litecoin went down -0.27%',
        wasViewed: true,
        type: 'loss',
      },
    ],
  });

  // act
  return removeAllAlertNotificationsFromUserDB(testUser._id).then((user) => {
    // assert
    expect(user).not.toBeUndefined();
    expect(user).toBeTruthy();
    expect(user.notifications.length).toBe(0);
  });
});

afterAll(async () => {
  await UserModel.findOneAndDelete({ email: 'test2@test.test' });
  return UserModel.findByIdAndDelete(testUser._id).then(() => {
    mongoose.connection.close();
  });
});
