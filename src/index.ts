import path from 'path'
import { spawn } from 'child_process'
import express from "express";
import { Request, Response, NextFunction } from "express";
import { connect } from "mongoose";
import { json } from "body-parser";
import { config } from "dotenv";
import dotenvExpand from "dotenv-expand"
import { createServer } from "http";

// import binanceAuthRoutes from "./routes/binance-auth";
import userRoutes from "./routes/user";
import authRoutes from "./routes/auth";
import coinbaseAuthRoutes from "./routes/coinbase-auth";
import coinbaseApiRoutes from "./routes/coinbase-api";
import redditApiRoutes from "./routes/reddit-api";
import { RequestError } from "./types/RequestError";
import cookieParser from "cookie-parser"

const myEnv = config()
dotenvExpand(myEnv)

const runScript = () => {
    return spawn('py', [
        path.join(__dirname, '../web-scraping/web-scraper.py'),
    ]);
}

connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        const app = express();

        app.use(json());
        app.use(cookieParser());

        app.use((_: Request, res: Response, next: NextFunction) => {
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
            res.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE");
            res.setHeader("Access-Control-Allow-Credentials", "true")
            next();
        });

        app.use(authRoutes);
        app.use("/user", userRoutes);
        // app.use("/binance", binanceAuthRoutes);
        app.use("/coinbase", coinbaseAuthRoutes);
        app.use("/coinbase-api", coinbaseApiRoutes);
        app.use("/reddit-api", redditApiRoutes)

        app.use((err: Error, _: Request, res: Response, _2: NextFunction) => {
            if (err instanceof RequestError) {
                return res.status((err as RequestError).status).json({
                    title: (err as RequestError).title,
                    errorMessage: (err as RequestError).message,
                    errors: (err as RequestError).errors,
                });
            } else {
                return res.status(500).json({ title: "Unexpected Server Error", errorMessage: err.message });
            }
        });

        const server = createServer(app)

        server.listen(3000, () => {
            console.log("listening on port 3000");
            runScript()
        });
    })
    .catch((error) => {
        console.log(error);
    });
