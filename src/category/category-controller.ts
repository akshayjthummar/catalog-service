import { NextFunction, Response, Request } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Category } from "./category-types";
import { CategoryService } from "./category-service";
import { Logger } from "winston";
import mongoose from "mongoose";

export class CategoryController {
    constructor(
        private categoryService: CategoryService,
        private logger: Logger,
    ) {
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getOne = this.getOne.bind(this);
        this.getAll = this.getAll.bind(this);
    }
    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        const { name, priceConfiguration, attributes } = req.body as Category;
        // Call the service

        const category = await this.categoryService.create({
            name,
            priceConfiguration,
            attributes,
        });
        this.logger.info("Created category", { id: category._id });
        res.json({ id: category._id });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        const { name, priceConfiguration, attributes } = req.body as Category;
        // Call the service

        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return next(createHttpError(400, "invalid request"));
        }

        const category = await this.categoryService.update(id, {
            name,
            priceConfiguration,
            attributes,
        });
        this.logger.info("Category updated", { id: category?._id });
        res.json({ id: category?._id });
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return next(createHttpError(400, "invalid request"));
        }

        const category = await this.categoryService.delete(id);
        this.logger.info("Category deleted", { id: category?._id });
        res.json({ id: category?._id });
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return next(createHttpError(400, "invalid request"));
        }

        const category = await this.categoryService.getOne(id);
        this.logger.info("Category find By ID", { id: category?._id });
        res.json(category);
    }

    async getAll(req: Request, res: Response) {
        const category = await this.categoryService.getAll();
        this.logger.info("get all category");
        res.json(category);
    }
}
