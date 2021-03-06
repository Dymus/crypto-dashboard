import { sign, verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { JWTTokenPayload } from "../types/JWTTokenPayload";
import { getUserById } from "../database/userDB";

export const refreshJWT = async (JWTRefreshToken: string) => {
  try {
    const decodedJWTToken = verify(JWTRefreshToken, fs.readFileSync(path.join(__dirname, '..', '..', 'keys', 'public.pem'))) as JWTTokenPayload
    if (decodedJWTToken) {
      const user = await getUserById(decodedJWTToken.userId);
      const newJWTToken = sign(
        {
          userId: user._id.toString(),
          email: user.email,
          isCoinbaseApproved: user.coinbaseTokens ? true : false,
          isGeminiApproved: user.geminiKeys ? true : false,
        },
        fs.readFileSync(
          path.join(__dirname, '..', '..', 'keys', 'private.pem')
        ),
        {
          expiresIn: 7200,
          algorithm: 'RS256',
        }
      );

      return Promise.resolve(newJWTToken);
    } else {
      return Promise.reject();
    }
  } catch {
    return Promise.reject();
  }
}