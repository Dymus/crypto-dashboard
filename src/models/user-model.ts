import { getModelForClass, prop } from "@typegoose/typegoose";

// class AccessToken {
//   @prop()
//   public access_token: string;

//   @prop()
//   public token_type: string;

//   @prop()
//   public expires_in: number;

//   @prop()
//   public refresh_token: string;

//   @prop()
//   public scope: string
// }

export class User {
  @prop({ required: true, })
  public email: string

  @prop({ required: true })
  public password: string

  @prop()
  public token?: string
}

export const UserModel = getModelForClass(User);