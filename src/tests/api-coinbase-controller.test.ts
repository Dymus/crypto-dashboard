import request from 'supertest';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Request, Response, NextFunction, response } from 'express';
import { createServer, Server } from 'http';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import { UserModel } from '../models/user-model';
import coinbaseApiRoutes from '../routes/coinbase-api';
import authRoutes from '../routes/auth';
import { RequestError } from '../types/RequestError';
import { createUser } from '../database/userDB';
import { hashSync } from 'bcrypt';
import { extractCookies } from './test-helpers/cookie-helper';

let server: Server;
let mongoose;
let testUser;
let jwt;
let invalidJwt;
let cookies;
let invalidCookies;

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

  app.use(coinbaseApiRoutes);
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
  const loginReponse = await request(server).post('/login').send({ email: 's@h.sh', password: 'Password1', rememerme: false });
  const invalidLoginReponse = await request(server)
    .post('/login')
    .send({ email: 'test@test.test', password: 'Abcd1234', rememerme: false });
  jwt = loginReponse.body.jwt;
  invalidJwt = invalidLoginReponse.body.jwt;
  // console.log(loginReponse.body)
  // console.log(invalidLoginReponse.body)
  cookies = extractCookies(loginReponse.headers);
  invalidCookies = extractCookies(invalidLoginReponse.headers);
});

/**
 * test GET to /coinbase-api/wallet
 */
describe('GET /wallet', () => {
  test('responds with 200', async () => {
    // act
    return request(server)
      .get('/wallet')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.walletAccounts).toBeTruthy();
        expect(response.body.euroWallet).toBeTruthy();
        expect(response.body.createdAt).toBeTruthy();
      });
  });

  test('responds with 401 because invalid JWT', async () => {
    // act
    return request(server)
      .get('/wallet')
      .set('Authorization', `Bearer ${invalidJwt}`)
      .set('Cookie', `refreshToken=${invalidCookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });
});

/**
 * test GET to /coinbase-api/account-transactions/:accountId
 */
describe('GET /account-transactions/:accountId', () => {
  test('responds with 200', async () => {
    // act
    return request(server)
      .get('/account-transactions/446c55a3-f014-59ed-a1a4-73e8614ca856')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.transactions).toBeTruthy();
      });
  });

  test('responds with 404 because invalid account ID', async () => {
    // act
    return request(server)
      .get('/account-transactions/askdmalksd546')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(404);
      });
  });

  test('responds with 422 because missing account ID', async () => {
    // act
    return request(server)
      .get('/account-transactions')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 401 because invalid JWT', async () => {
    // act
    return request(server)
      .get('/account-transactions/446c55a3-f014-59ed-a1a4-73e8614ca856')
      .set('Authorization', `Bearer ${invalidJwt}`)
      .set('Cookie', `refreshToken=${invalidCookies.refreshToken}`)
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
