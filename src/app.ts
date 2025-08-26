import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import caregoryRouter from "./category/category-router";
import productRouter from "./product/product-router";
import toppingRouter from "./topping/topping-router";
import cors from "cors";
import config from "config";

const app = express();

const ALLOWED_DOMAINS = [
    config.get("domain.ADMIN_UI_DOMAIN"),
    config.get("domain.CLIENT_UI_DOMAINL"),
];

app.use(cors({ origin: ALLOWED_DOMAINS as string[], credentials: true }));

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
