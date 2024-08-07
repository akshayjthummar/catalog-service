import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { Product } from "./product-types";
import { FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";

export class ProductController {
    constructor(
        private productService: ProductService,
        private storage: FileStorage,
    ) {}
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
        const image = req.files!.image as UploadedFile;
        const imageName = uuidv4();
        await this.storage.upload({
            fileName: imageName,
            fileData: image.data.buffer,
        });
        // save product to database
        const {
            name,
            attributes,
            categoryId,
            description,
            priceConfiguration,
            tenantId,
        } = req.body as Product;
        const product = {
            name,
            attributes: JSON.parse(attributes) as string,
            categoryId,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            tenantId,
            image: imageName,
        };
        const newProduct = await this.productService.createProduct(
            product as Product,
        );
        // send response
        res.json({ id: newProduct._id });
    };
}
