import request from 'supertest';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import { UserModel } from '../models/user-model';
import coinbaseAuthRoutes from '../routes/coinbase-auth';
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

  app.use(coinbaseAuthRoutes);
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
});

/**
 * test POST to /coinbase/save-coinbase-access
 */
describe('POST /save-coinbase-access', () => {
  test('responds with 201', async () => {
    // act
    return request(server)
      .post('/save-coinbase-access')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ coinbaseTokens: { access_token: 'abcdEFGH', refresh_token: '12345678' } })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(201);
      });
  });

  test('responds with 422 because missing coinbase tokens', async () => {
    // act
    return request(server)
      .post('/save-coinbase-access')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 401 because missing JWT', async () => {
    // act
    return request(server)
      .post('/save-coinbase-access')
      .send({ coinbaseTokens: { access_token: 'abcdEFGH', refresh_token: '12345678' } })
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 409 because missing refresh token', async () => {
    // act
    return request(server)
      .post('/save-coinbase-access')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ coinbaseTokens: { access_token: 'abcdEFGH', refresh_token: '12345678' } })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(409);
      });
  });
});

afterAll(() => {
  return UserModel.findOneAndDelete({ email: 'test@test.test' }).then(() => {
    mongoose.connection.close();
    server.close();
  });
});
