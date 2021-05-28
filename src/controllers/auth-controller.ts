import { DocumentType } from '@typegoose/typegoose';

import { JWTTokenPayload } from '../types/JWTTokenPayload';
import { User } from '../models/user-model';

// tested partially by calling API points
export const userInfoUpToDate = (user: DocumentType<User>, decodedJWTToken: JWTTokenPayload) => {
  if (decodedJWTToken.isCoinbaseApproved && decodedJWTToken.isGeminiApproved) {
    return user.coinbaseTokens !== null && user.geminiKeys !== null
  } else if (!decodedJWTToken.isCoinbaseApproved && decodedJWTToken.isGeminiApproved) {
    return user.coinbaseTokens === null && user.geminiKeys !== null
  } if (decodedJWTToken.isCoinbaseApproved && !decodedJWTToken.isGeminiApproved) {
    return user.coinbaseTokens !== null && user.geminiKeys === null
  } else {
    return user.coinbaseTokens === null
  }
}