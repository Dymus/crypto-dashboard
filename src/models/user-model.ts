import { getModelForClass, ModelOptions, prop, Severity } from "@typegoose/typegoose";

export class CoinbaseAccessToken {
    @prop()
    public access_token: string;

    @prop()
    public refresh_token: string;
}

export class GeminiKeys {
    @prop()
    public apiKey: string;

    @prop()
    public apiSecret: string;
}

// export class CoinAlerts {
//     @prop()
//     public alerts: {

//     };
// }

@ModelOptions({options: {allowMixed: Severity.ALLOW }})
export class User {
    @prop({ required: true })
    public email: string;

    @prop({ required: true })
    public password: string;

    @prop({ _id: false, default: [] as AlertNotification[] })
    notifications?: AlertNotification[]

    @prop({ _id: false, default: null })
    coinbaseTokens?: CoinbaseAccessToken;

    @prop({ _id: false, default: null })
    geminiKeys?: GeminiKeys;

    @prop({ _id: false, default: {} })
    alerts?: {};
}

export const UserModel = getModelForClass(User);
