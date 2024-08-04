import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import caregoryRouter from "./category/category-router";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.use("/categories", caregoryRouter);

app.use(globalErrorHandler);

export default app;
