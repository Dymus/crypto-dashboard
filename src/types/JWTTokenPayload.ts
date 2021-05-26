export type JWTTokenPayload = {
    userId: string;
    email: string;
    isCoinbaseApproved: boolean;
    isGeminiApproved: boolean
};
