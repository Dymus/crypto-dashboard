import request from 'supertest';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import express, { json } from 'express';
import cookieParser from 'cookie-parser';

import { User, UserModel } from '../models/user-model';
import authRoutes from '../routes/auth';
import { RequestError } from '../types/RequestError';
import { extractCookies } from './test-helpers/cookie-helper';

let server: Server;
let mongoose;
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
});

/**
 * test POST to /register endpoint
 */
describe('POST /register', () => {
  test('responds with 201', async () => {
    // arrange
    await UserModel.deleteMany({ email: 'test@test.test' });
    // act
    return request(server)
      .post('/register')
      .send({ email: 'test@test.test', password: 'Abcd1234' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(201);
      });
  });

  test('responds with 422 because already registered with this email', async () => {
    // act
    return request(server)
      .post('/register')
      .send({ email: 'test@test.test', password: 'Abcd1234' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 422 because invalid email', async () => {
    // act
    return request(server)
      .post('/register')
      .send({ email: 'testtest.test', password: 'Abcd1234' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 422 because missing email', async () => {
    // act
    return request(server)
      .post('/register')
      .send({ password: 'Abcd1234' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 422 because invalid email & password', async () => {
    // act
    return request(server)
      .post('/register')
      .send({ email: 'testtest.test', password: '1234' })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 422 because missing email & passowrd', async () => {
    // act
    return request(server)
      .post('/register')
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });
});

/**
 * test POST to /login endpoint
 */
describe('POST /login', () => {
  test('responds with 200', async () => {
    // act
    return request(server)
      .post('/login')
      .send({ email: 'test@test.test', password: 'Abcd1234', rememberMe: false })
      .then((response) => {
        cookies = extractCookies(response.headers);
        // assert
        expect(response.statusCode).toBe(200);
        expect(response.body.jwt).toBeTruthy();
        expect(cookies.refreshToken).toBeTruthy();
      });
  });

  test('responds with 422 because invalid email', async () => {
    // act
    return request(server)
      .post('/login')
      .send({ email: 'testtest.test', password: 'Abcd1234', rememberMe: false })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(422);
      });
  });

  test('responds with 401 because invalid password', async () => {
    // act
    return request(server)
      .post('/login')
      .send({ email: 'test@test.test', password: 'Abca1234', rememberMe: false })
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });
});

/**
 * test GET to /refresh-token endpoint
 */
describe('GET /refresh-token', () => {
  // act
  test('responds with 201', async () => {
    return request(server)
      .get('/refresh-token')
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(201);
        expect(response.body.jwt).toBeTruthy();
      });
  });

  test('responds with 401 because invalid refresh token', async () => {
    // act
    return request(server)
      .get('/refresh-token')
      .set(
        'Cookie',
        `refreshToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGFmYzVkNTBiMjFiY2MzMDBjZjQ4YTYiLCJpYXQiOjE2MjIxMzIxODEsImV4cCI6MTYyMjEzOTM4MX0.Rq-FBMik97zDZsczWCSZc0fUo34O3BJi6W_y1cxDLThxeufhGZfmoZ5nr_5jUs25m03aLhn3NwWD6E6Mfz_tIfuIATNvQl3MyQVYe6PeE-qMWgmEQY4ILAASoQTEyEGYz1tuVbT2lZdi25_s9XtyETWI0dSGJQJQcGc4hL3Hyy0`,
      )
      .then((response) => {
        // assert
        expect(response.statusCode).toBe(401);
      });
  });

  test('responds with 401 because missing refresh token', async () => {
    // act
    return request(server)
      .get('/refresh-token')
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
