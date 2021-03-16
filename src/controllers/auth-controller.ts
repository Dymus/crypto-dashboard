import { RequestHandler } from "express";
import { sign, verify } from "jsonwebtoken";
import { compareSync, hashSync } from "bcrypt";
import { validationResult } from "express-validator";
import { RequestError } from "../types/RequestError";
import { createUser, getUser } from "../database/userDB";
import path from "path";
import fs from "fs";

export const postRegister: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, "Invalid input", validationResult(req).array())
    );
  }
  createUser({
    email: req.body.email,
    password: hashSync(req.body.password, 5),
  })
    .then(
      () => {
        return res.status(201).send();
      },
      () => {
        throw new RequestError(409, "User could not be created");
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const postLogin: RequestHandler = async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(
      new RequestError(422, "Invalid input", validationResult(req).array())
    );
  }

  getUser(req.body.email)
    .then(
      (user) => {
        if (compareSync(req.body.password, user.password)) {
          return res.status(200).json({
            jwt: sign(
              {
                userId: user._id.toString(),
                email: user.email,
              },
              fs.readFileSync(path.join(__dirname, '..', '..', "keys", "private.pem")),
              { expiresIn: 7200, algorithm: "RS256" }
            ),
          });
        } else {
          throw new RequestError(
            401,
            "Password does not match with this email"
          );
        }
      },
      () => {
        throw new RequestError(404, "User could not be found");
      }
    )
    .catch((internalError) => {
      return next(internalError);
    });
};

export const test = (req, res, next) => {
  const testVariable = verify(
    req.get("Authorization").split(" ")[1],
    fs.readFileSync(path.join(__dirname, '..', '..', "keys", "public.pem"))
  );
  return res.json(testVariable);
};
