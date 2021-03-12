import { RequestHandler } from 'express';
import axios from "axios";
import { UserModel } from "../models/user-model";

export const getCoinbaseLogin: RequestHandler = async (req, res, next) => {
  console.log("it hit me  ")
  res.redirect(`http://www.coinbase.com/oauth/authorize?response_type=code&client_id=920061065859143b276c9118f33e3cd48bde5ededaa8e2cfc0ef8ac5d7fb51db&redirect_uri=http://localhost:3000/coinbase/redirect&scope=wallet:accounts:read,wallet:sells:read,wallet:buys:read,wallet:deposits:read&account=all`);
};

export const getCoinbaseRedirect: RequestHandler = async (req, res, next) => {
  return axios.post(
    `https://api.coinbase.com/oauth/token?grant_type=authorization_code&code=${req.query.code}&client_id=920061065859143b276c9118f33e3cd48bde5ededaa8e2cfc0ef8ac5d7fb51db&client_secret=305b693152162b21da71498d9037fdb171a85f3994ef56a08828e16f2699d425&redirect_uri=http://localhost:3000/coinbase/redirect`)
    .then(
      (response) => {
        const user = new UserModel();
        user.token = response.data
        user.save()
          .then(() => {
            return res.redirect(
              `http://localhost:8080/coinbase-login-success/${response.data.access_token}`)
          })
      },
      (error) => { return res.status(error.response.status) }
    )
};
