import express from "express";
import { Request, Response, NextFunction } from "express";
import { connect } from "mongoose";
import { json } from "body-parser";

import authRoutes from "./routes/auth";
import { RequestError } from "./types/RequestError";

connect(
  "mongodb+srv://sa:CryptoDashboard@cryptodashboard.0obwg.mongodb.net/CryptoDashboard",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => {
    const app = express();

    app.use(json());

    app.use((_: Request, res: Response, next: NextFunction) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });

    app.use(authRoutes);

    app.use((err: Error, req: Request, res: Response, _2: NextFunction) => {
      if (err instanceof RequestError) {
        return res
          .status((err as RequestError).status)
          .json({
            errorMessage: (err as RequestError).message,
            errors: (err as RequestError).errors,
          });
      } else {
        return res.status(500).json({ message: err.message });
      }
    });

    app.listen(3000, () => {
      console.log("listening on port 3000");
    });
  })
  .catch((error) => {
    console.log(error);
  });
