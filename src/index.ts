import express from "express";
import { Request, Response, NextFunction } from "express";
import { connect } from "mongoose";
import { json } from "body-parser";

import authRoutes from "./routes/auth";
import binanceAuthRoutes from "./routes/binance-auth";
import coinbaseAuthRoutes from "./routes/coinbase-auth";
import coinbaseApiRoutes from "./routes/coinbase-api";

connect(
    "mongodb+srv://sa:CryptoDashboard@cryptodashboard.0obwg.mongodb.net/CryptoDashboard",
    { useNewUrlParser: true, useUnifiedTopology: true }
)
    .then(() => {
        const app = express();

        app.use(json());

        app.use((_: Request, res: Response, next: NextFunction) => {
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); //allow those clients to access the API using those methods
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, CoinbaseAccessToken'); //allow those clients to access the API using this headers
            res.setHeader("Access-Control-Allow-Origin", "*");
            next();
        });

        app.use("/binance", binanceAuthRoutes);
        app.use("/coinbase", coinbaseAuthRoutes);
        app.use("/coinbase-api", coinbaseApiRoutes);
        app.use(authRoutes);

        app.listen(3000, () => {
            console.log("listening on port 3000");
        });
    })
    .catch((error) => {
        console.log(error);
    });
