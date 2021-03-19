import { buildSchema, getModelForClass, prop } from "@typegoose/typegoose";

export class AccessToken {
    @prop()
    public access_token: string;

    @prop()
    public refresh_token: string;
}
export const AccessTokenSchema = buildSchema(AccessToken);
export const AccessTokenModel = getModelForClass(AccessToken);
