import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { Product } from "./product-types";
import { FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { Logger } from "winston";

export class ProductController {
    constructor(
        private productService: ProductService,
        private storage: FileStorage,
        private logger: Logger,
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
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body as Product;

        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            attributes: JSON.parse(attributes) as string,
            tenantId,
            categoryId,
            isPublish,
            image: imageName,
        };
        const newProduct = await this.productService.createProduct(
            product as Product,
        );
        this.logger.info("Product Created", { id: newProduct._id });

        // send response
        res.json({ id: newProduct._id });
    };

    update = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }
        const productId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(createHttpError(400, "Invalid request"));
        }

        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            oldImage = await this.productService.getProductImage(productId);
            const image = req.files.image as UploadedFile;
            imageName = uuidv4();
            await this.storage.upload({
                fileName: imageName,
                fileData: image.data.buffer,
            });
            await this.storage.delete(oldImage!);
        }

        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body as Product;

        const product = {
            name,
            description,
            priceConfiguration: JSON.parse(priceConfiguration) as string,
            attributes: JSON.parse(attributes) as string,
            tenantId,
            categoryId,
            isPublish,
            image: imageName ? imageName : (oldImage as string),
        };

        const updatedProduct = await this.productService.updateProduct(
            productId,
            product,
        );

        this.logger.info("Product Updated", { id: updatedProduct?._id });

        res.json({ id: updatedProduct?._id });
    };
}
