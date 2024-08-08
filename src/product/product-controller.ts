import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { Filter, Product } from "./product-types";
import { FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { Logger } from "winston";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";

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

        // Check if tenant has access to the product
        const product = await this.productService.getProduct(productId);

        if (!product) {
            return next(createHttpError(404, "Product not found"));
        }

        if (req.auth?.role !== Roles.ADMIN) {
            const tenant = (req as AuthRequest).auth.tenant;

            if (product.tenantId !== String(tenant)) {
                return next(
                    createHttpError(
                        403,
                        "You are not allowed to access this product",
                    ),
                );
            }
        }

        let imageName: string | undefined;
        let oldImage: string | undefined;

        if (req.files?.image) {
            oldImage = product.image;
            const image = req.files.image as UploadedFile;
            imageName = uuidv4();
            await this.storage.upload({
                fileName: imageName,
                fileData: image.data.buffer,
            });
            await this.storage.delete(oldImage);
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

        const productToUpdate = {
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
            productToUpdate,
        );

        this.logger.info("Product Updated", { id: updatedProduct?._id });

        res.json({ id: updatedProduct?._id });
    };

    index = async (req: Request, res: Response) => {
        const { q, tenantId, categoryId, isPublish } = req.query;

        const filters: Filter = {};
        if (isPublish === "true") {
            filters.isPublish = true;
        }
        if (tenantId) filters.tenantId = tenantId as string;
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId as string))
            filters.categoryId = new mongoose.Types.ObjectId(
                categoryId as string,
            );

        const products = await this.productService.getProducts(
            q as string,
            filters,
        );
        res.json(products);
    };
}
