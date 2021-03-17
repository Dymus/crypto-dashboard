import { RequestHandler } from "express";
import axios from "axios";
import { UserModel } from "../models/user-model";
import { sign } from "jsonwebtoken";
import { hashSync } from "bcrypt";

export const getBinanceLogin: RequestHandler = async (req, res, next) => {
    console.log("it hit me  ");
    res.redirect(
        `https://accounts.binance.com/en/oauth/authorize?response_type=code&client_id=QnF7GOzTUNps2mS24Tuvmp5MWO6lOaNcw8vWhSgw177LrcFed5saXO1vDFFNUnif&scope=user:email,user:address&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fbinance%2Fredirect`
    );
};

export const getBinanceRedirect: RequestHandler = async (req, res, next) => {
    console.log("kokhoooot");
    return axios
        .post(
            `https://accounts.binance.com/oauth/token?client_id=QnF7GOzTUNps2mS24Tuvmp5MWO6lOaNcw8vWhSgw177LrcFed5saXO1vDFFNUnif&client_secret=ZnNbLIZtmklnEwnMRtBH4YyjCy2BwTUXX1mQZfiSFV6ktNFG2PxeQEzh1D3E7vOB&grant_type=authorization_code&code=${req.query.code}&redirect_uri=http://localhost:3000/binance/redirect`
        )
        .then(
            (response) => {
                const user = new UserModel();
                user.token = response.data;
                user.save().then(() => {
                    return res.redirect(
                        `http://localhost:8080/binance-login-success/${response.data.access_token}`
                    );
                });
            },
            (error) => {
                return res.status(error.response.status);
            }
        );
};

export const postRegister: RequestHandler = async (req, res, next) => {
    UserModel.create({
        username: req.body.username,
        password: hashSync(req.body.password, 5),
    })
        .then((user) => {
            return user ? res.status(201).send() : res.status(409).send();
        })
        .catch((error) => {
            return res.status(500).json({ error });
        });
};

export const postLogin: RequestHandler = async (req, res, next) => {};
