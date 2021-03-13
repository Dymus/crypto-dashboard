import { RequestHandler } from 'express';
import { UserModel } from "../models/user-model";
import { sign } from "jsonwebtoken";
import { compareSync, hashSync } from "bcrypt"

export const postRegister: RequestHandler = async (req, res, next) => {
  UserModel.create({
    username: req.body.username,
    password: hashSync(req.body.password, 5)
  })
    .then(
      (user) => { return user ? res.status(201).send() : res.status(409).send() }
    )
    .catch((error) => { return res.status(500).json({ error }) })
}

export const postLogin: RequestHandler = async (req, res, next) => {
  let loadedUser = new UserModel();
  UserModel.findOne({ username: req.body.username })
    .then((user) => {
      loadedUser = user;
      return compareSync(req.body.password, user.password)
    })
    .then(
      () => {
        return res.status(200)
          .json({
            jwt: sign({
              userId: loadedUser._id.toString(),
              username: loadedUser.username
            },
              "UCNcryptoDASHBOARDsuperSECUREstring",
              { expiresIn: 7200 }
            )
          })
      },
      () => { return res.status(401).send() }
    )
    .catch((error) => { return res.status(500).json({ error }) })
}

