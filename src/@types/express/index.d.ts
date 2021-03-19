import { UserModel } from "../../models/user-model";

export {};

declare global {
    namespace Express {
        interface Request {
            user: UserModel;
            userId?: string;
            email?: string;
            isCoinbaseApproved?: boolean;
            coinbaseAccessToken: string;
            coinbaseRefreshToken: string;
        }
    }
}
