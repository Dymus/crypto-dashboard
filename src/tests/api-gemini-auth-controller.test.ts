import request from 'supertest';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import { UserModel } from '../models/user-model';
import geminiAuthRoutes from '../routes/gemini-auth';
import authRoutes from '../routes/auth';
import { RequestError } from '../types/RequestError';
import { createUser } from '../database/userDB';
import { hashSync } from 'bcrypt';
import { extractCookies } from './test-helpers/cookie-helper';
import { sign } from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

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
 * test POST to /gemini/save-gemini-access
 */
describe('POST /save-gemini-access', () => {
  test('responds with 201', async () => {
    // act
    return request(server)
      .post('/save-gemini-access')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ apiKey: 'abcdEFGH', apiSecret: '12345678' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(201);
        expect(response.body.JWTToken).toBeTruthy();
      });
  });

  test('responds with 401 because missing JWT', async () => {
    // act
    return request(server)
      .post('/save-gemini-access')
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ apiKey: 'abcdEFGH', apiSecret: '12345678' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 422 because missing API secret', async () => {
    // act
    return request(server)
      .post('/save-gemini-access')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ apiKey: 'abcdEFGH' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 422 because missing API key and secret', async () => {
    // act
    return request(server)
      .post('/save-gemini-access')
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
      .post('/save-gemini-access')
      .set(
        'Authorization',
        `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDcyOTk5Zjc1N2QyMTYxNWM2OWFjMGMiLCJlbWFpbCI6InNAaC5zaCIsImlzQ29pbmJhc2VBcHByb3ZlZCI6ZmFsc2UsImlzR2VtaW5pQXBwcm92ZWQiOmZhbHNlLCJpYXQiOjE2MjIxOTI4ODYsImV4cCI6MjM0MjE5Mjg4Nn0.E_uWAjXIFtcIcIdgAnAM4fSkpeVlFxKMMtp9v10YTXVTzjXzGPkdbZpsgGi0wfWOZa7J0c9_d-mV6yCstF5gyPx2E_ftmBscBPY_2cHEN2KSAnGfhL5u24KhVQjMyOpdPoAsBEErWJbFjoyovl588mEiyOTHJTmSrnmnl8cu9jc`,
      )
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ apiKey: 'abcdEFGH', apiSecret: '12345678' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });
});

/**
 * test DELETE to /gemini/delete-gemini-access
 */
describe('DELETE /delete-gemini-access', () => {
  test('responds with 200', async () => {
    // arrange
    const newJWT = (
      await request(server)
        .post('/save-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
        .send({ apiKey: 'abcdEFGH', apiSecret: '12345678' })
    ).body.JWTToken;

    // act
    return request(server)
      .delete('/delete-gemini-access')
      .set('Authorization', `Bearer ${newJWT}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(200);
      });
  });

  test('responds with 401 because not connected with Gemini', async () => {
    //arrange
    const firstJWT = (
      await request(server)
        .post('/save-gemini-access')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
        .send({ apiKey: 'abcdEFGH', apiSecret: '12345678' })
    ).body.JWTToken;

    const secondJWT = (
      await request(server)
        .delete('/delete-gemini-access')
        .set('Authorization', `Bearer ${firstJWT}`)
        .set('Cookie', `refreshToken=${cookies.refreshToken}`)
    ).body.JWTToken;

    // act
    return request(server)
      .delete('/delete-gemini-access')
      .set('Authorization', `Bearer ${secondJWT}`)
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
