import express from "express";
import { Request, Response, NextFunction } from "express";
import { connect } from "mongoose";

import coinbaseAuthRoutes from './routes/coinbase-auth'

connect(
  'mongodb+srv://sa:CryptoDashboard@cryptodashboard.0obwg.mongodb.net/CryptoDashboard',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => {
    const app = express();

    app.use((_: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    });

    app.use('/coinbase', coinbaseAuthRoutes)

    app.listen(3000, () => {
      console.log("listening on port 3000")
    });
  })
  .catch((error) => { console.log(error) })