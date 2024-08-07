import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import caregoryRouter from "./category/category-router";
import productRouter from "./product/product-router";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.use("/categories", caregoryRouter);
app.use("/products", productRouter);

app.use(globalErrorHandler);

export default app;
