import { buildSchema, getModelForClass, prop } from "@typegoose/typegoose";

export class AccessToken {
    @prop()
    public access_token: string;

    @prop()
    public token_type: string;

    @prop()
    public expires_in: number;

    @prop()
    public refresh_token: string;

    @prop()
    public scope: string;
}
export const AccessTokenSchema = buildSchema(AccessToken);
export const AccessTokenModel = getModelForClass(AccessToken);
