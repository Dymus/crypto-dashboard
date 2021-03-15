import { Router } from "express";
import { postRegister, postLogin } from "../controllers/auth-controller";
import { body } from "express-validator";
import { UserModel } from "../models/user-model";

const router = Router();

router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email")
      .normalizeEmail()
      .custom((value) => {
        return UserModel.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("This email is already taken");
          }
        });
      }),

    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must have at least 8 characters.")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .withMessage(
        "Password must have at least one letter in lowercase, uppercase and number"
      ),
  ],
  postRegister
);

router.post("/login", postLogin);

export default router;
