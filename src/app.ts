import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import caregoryRouter from "./category/category-router";
import productRouter from "./product/product-router";
import toppingRouter from "./topping/topping-router";
import config from "config";
import cors from "cors";

const app = express();

const ALLOWED_DOMAINS = [
    config.get("frontend.clientUI"),
    config.get("frontend.adminUI"),
];

app.use(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    cors({
        origin: ALLOWED_DOMAINS as string[],
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.use("/categories", caregoryRouter);
app.use("/products", productRouter);
app.use("/topping", toppingRouter);

app.use(globalErrorHandler);

export default app;
