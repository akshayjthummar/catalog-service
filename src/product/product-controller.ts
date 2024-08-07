import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { Product } from "./product-types";

export class ProductController {
    constructor(private productService: ProductService) {}
    create = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        // Create Product
        // Image Upload
        // save product to database
        const {
            name,
            attributes,
            categoryId,
            description,
            priceConfiguration,
            tenantId,
            image,
        } = req.body as Product;
        const product = {
            name,
            attributes: JSON.parse(attributes) as string,
            categoryId,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            tenantId,
            image,
        };
        const newProduct = await this.productService.createProduct(
            product as Product,
        );
        // send response
        res.json({ id: newProduct._id });
    };
}
