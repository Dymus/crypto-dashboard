import { sign, verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { TokenPayload } from "../types/TokenPayload";
import { getUserById } from "../database/userDB";

export const refreshJWT = async (JWTrefreshToken: string) => {
  try {
    const decodedToken = verify(JWTrefreshToken, fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'public.pem'))) as TokenPayload
    if (decodedToken) {
      const user = await getUserById(decodedToken.userId);
      const newToken = sign(
        {
          userId: user._id.toString(),
          email: user.email,
          isCoinbaseApproved: user.coinbaseTokens ? true : false,
        },
        fs.readFileSync(
          path.join(__dirname, '..', '..', 'keys', 'private.pem')
        ),
        {
          expiresIn: 10,
          algorithm: 'RS256',
        }
      );

      return Promise.resolve(newToken);
    } else {
      return Promise.reject();
    }
  } catch {
    return Promise.reject();
  }
}