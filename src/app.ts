import express from "express";
import dotenv from "dotenv";
import connectDB from "./dbConnection/mongoose.connection";
import routes from "./router/index.routes";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { requestLogger } from "./helper/index";

const app = express();
dotenv.config();
const port = process.env.PORT || 5000;

async function Main() {
  const corsOptions: CorsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
  app.use(cookieParser());
  await connectDB();
  app.use(express.json());
  app.use(requestLogger);
  app.use("/api", routes);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

Main().catch((err) => {
  console.error("Error during app initialization", err);
});
