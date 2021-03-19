import { getModelForClass, prop } from "@typegoose/typegoose";

export class CoinbaseAccessToken {
    @prop()
    public access_token: string;

    @prop()
    public refresh_token: string;
}

export class User {
    @prop({ required: true })
    public email: string;

    @prop({ required: true })
    public password: string;

    @prop({ _id: false, default: null })
    coinbaseAccessToken: CoinbaseAccessToken;
}

export const UserModel = getModelForClass(User);
