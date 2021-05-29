import { sign } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

import { refreshJWT } from '../jwt-helpers/refresh-jwt-helper';

const myEnv = config();
dotenvExpand(myEnv);

let mongoose;

beforeAll(async () => {
  mongoose = await connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

test('refresh the JWT with correct refresh token', async () => {
  // arrange
  const token = sign(
    {
      userId: new ObjectId('6082999f7b7d21615c69ac0c'),
    },
    fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
    {
      expiresIn: 20,
      algorithm: 'RS256',
    },
  );

  // act
  return refreshJWT(token).then((newToken) => {
    // assert
    expect(newToken).toBeTruthy();
  });
});

test('refresh of JWT should fail with incorrect refresh token', async () => {
  // arrange
  const token = sign(
    {
      userId: new ObjectId('608299af7bad21645c69ac0c'),
    },
    fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'private.pem')),
    {
      expiresIn: 20,
      algorithm: 'RS256',
    },
  );

  // act
  return refreshJWT(token).catch((error) => {
    // assert
    expect(error).toBeInstanceOf(Error);
  });
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});
