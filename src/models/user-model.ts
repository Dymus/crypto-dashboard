import { getModelForClass, prop } from "@typegoose/typegoose";

class User {
    @prop({ required: true })
    public username: string;

    @prop({ required: true })
    public password: string;

    @prop()
    public token?: string;
}

export const UserModel = getModelForClass(User);
