import { getModelForClass, prop } from "@typegoose/typegoose";

class AccessToken {
  @prop()
  public access_token: string;

  @prop()
  public token_type: string;

  @prop()
  public expires_in: number;

  @prop()
  public refresh_token: string;

  @prop()
  public scope: string
}

class User {
  @prop()
  public token?: AccessToken
}

export const UserModel = getModelForClass(User);