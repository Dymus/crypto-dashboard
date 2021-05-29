import request from 'supertest';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import { UserModel } from '../models/user-model';
import geminiApiRoutes from '../routes/gemini-api';
import geminiAuthRoutes from '../routes/gemini-auth';
import authRoutes from '../routes/auth';
import { RequestError } from '../types/RequestError';
import { createUser } from '../database/userDB';
import { hashSync } from 'bcrypt';
import { extractCookies } from './test-helpers/cookie-helper';

let server: Server;
let mongoose;
let testUser;
let jwt;
let cookies;

beforeAll(async () => {
  const myEnv = config();
  dotenvExpand(myEnv);

  mongoose = await connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const app = express();
  app.use(json());
  app.use(cookieParser());

  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

  app.use(geminiAuthRoutes);
  app.use(geminiApiRoutes);
  app.use(authRoutes);

  app.use((err: Error, _: Request, res: Response, _2: NextFunction) => {
    if (err instanceof RequestError) {
      return res.status((err as RequestError).status).json({
        title: (err as RequestError).title,
        errorMessage: (err as RequestError).message,
        errors: (err as RequestError).errors,
      });
    } else {
      return res.status(500).json({ title: 'Unexpected Server Error', errorMessage: err.message });
    }
  });

  server = createServer(app);
  server.listen();

  testUser = await createUser({ email: 'test@test.test', password: hashSync('Abcd1234', 5) });
});

beforeEach(async () => {
  const loginReponse = await request(server).post('/login').send({ email: 'test@test.test', password: 'Abcd1234' });
  jwt = loginReponse.body.jwt;
  cookies = extractCookies(loginReponse.headers);
  jwt = (await request(server)
    .post('/save-gemini-access')
    .set('Authorization', `Bearer ${jwt}`)
    .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    .send({ apiKey: 'account-v0HhqXlhJ4ZUUvTvo5C1', apiSecret: '3DKAJxk2kPpgv12GGndDZBBdtqM1' })).body.JWTToken
});

/**
 * test GET tp /gemini/balances
 */
describe('GET /balances', () => {
  test('responds with 200', async () => {
    // act
    return request(server)
      .get('/balances')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.accounts).toBeTruthy();
        expect(response.body.euroWallet).toBeTruthy();
        expect(response.body.createdAt).toBeTruthy();
      });
  });

  test('responds with 401 because invalid API key and secret', async () => {
    // arrange
    const firstJWT = (
      await request(server)
        .delete('/delete-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    ).body.JWTToken;

    const secondJWT = (
      await request(server)
        .post('/save-gemini-access')
        .set('Authorization', `Bearer ${firstJWT}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
        .send({ apiKey: 'account-aslkmdaslkdmaslkd', apiSecret: 'alkmsdlaksmdlkasmdlkad' })
    ).body.JWTToken;

    // act
    return request(server)
      .get('/balances')
      .set('Authorization', `Bearer ${secondJWT}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 401 because not connected with Gemini', async () => {
    // arrange
    const newJWT = (
      await request(server)
        .delete('/delete-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    ).body.JWTToken;

    // act
    return request(server)
      .get('/balances')
      .set('Authorization', `Bearer ${newJWT}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 401 because JWT missing', async () => {
    // act
    return request(server)
      .get('/balances')
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });
});

/**
 * test GET to /gemini/account-transactions/:currencyCode
 */
describe('GET /account-transactions/:currencyCode', () => {
  test('responds with 200', async () => {
    // act
    return request(server)
      .get('/account-transactions/btc')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.transactions).toBeTruthy();
        expect(response.body.transactions.length).toBeGreaterThan(0);
      });
  });

  test('responds with 201', async () => {
    // act
    return request(server)
      .get('/account-transactions/doge')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.transactions).toBeTruthy();
        expect(response.body.transactions.length).toBe(0);
      });
  });

  test('responds with 401 because wrong secret', async () => {
    // arrange
    const firstJWT = (
      await request(server)
        .delete('/delete-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    ).body.JWTToken;

    const secondJWT = (
      await request(server)
        .post('/save-gemini-access')
        .set('Authorization', `Bearer ${firstJWT}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
        .send({ apiKey: 'account-asdasdas5d4as6d4', apiSecret: 'akjsndakndakjsnd' })
    ).body.JWTToken;

    // act
    return request(server)
      .get('/account-transactions/eth')
      .set('Authorization', `Bearer ${secondJWT}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 401 because not authenticated with Gemini', async () => {
    // arrange
    const newJWT = (
      await request(server)
        .delete('/delete-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    ).body.JWTToken;

    // act
    return request(server)
      .get('/account-transactions/eth')
      .set('Authorization', `Bearer ${newJWT}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 401 because JWT missing', async () => {
    // act
    return request(server)
      .get('/account-transactions/eth')
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });
});

afterAll(() => {
  return UserModel.findOneAndDelete({ email: 'test@test.test' }).then(() => {
    mongoose.connection.close();
    server.close();
  });
});
