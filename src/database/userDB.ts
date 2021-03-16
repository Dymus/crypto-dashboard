import { User, UserModel } from "../models/user-model";

export const createUser = (user: User) => {
  return UserModel.create(user).then((createdUser) =>
    createdUser ? Promise.resolve(createdUser) : Promise.reject()
  );
};

export const getUser = (email: string) => {
  return UserModel.findOne({ email }).then((user) =>
    user ? Promise.resolve(user) : Promise.reject()
  );
};
