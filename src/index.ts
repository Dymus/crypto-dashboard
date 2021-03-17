import express from "express";
import { Request, Response, NextFunction } from "express";
import { connect } from "mongoose";
import { json } from "body-parser";
import { config } from 'dotenv'

import authRoutes from "./routes/auth";
import binanceAuthRoutes from "./routes/binance-auth";
import coinbaseAuthRoutes from "./routes/coinbase-auth";
import coinbaseApiRoutes from "./routes/coinbase-api";
import authRoutes from "./routes/auth";
import { RequestError } from "./types/RequestError";


config()

connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => {
    const app = express();

    app.use(json());

    app.use((_: Request, res: Response, next: NextFunction) => {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, CoinbaseAccessToken'); //allow those clients to access the API using this headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });

    app.use(authRoutes);
    app.use("/binance", binanceAuthRoutes);
    app.use("/coinbase", coinbaseAuthRoutes);
    app.use("/coinbase-api", coinbaseApiRoutes);

    app.use((err: Error, req: Request, res: Response, _2: NextFunction) => {
      if (err instanceof RequestError) {
        return res
          .status((err as RequestError).status)
          .json({
            errorMessage: (err as RequestError).message,
            errors: (err as RequestError).errors,
          });
      } else {
        return res.status(500).json({ errorMessage: err.message });
      }
    });

    app.listen(3000, () => {
      console.log("listening on port 3000");
    });
  })
  .catch((error) => {
    console.log(error);
  });