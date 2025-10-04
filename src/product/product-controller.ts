import { NextFunction, Response } from "express";
import { Request } from "express-jwt";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ProductService } from "./product-service";
import { Filter, Product } from "./product-types";
import { bufferToArrayBuffer, FileStorage } from "../common/types/storage";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { Logger } from "winston";
import { AuthRequest } from "../common/types";
import { Roles } from "../common/constants";
import { MessageProducerBroker } from "../common/types/broker";

export class ProductController {
    constructor(
        private productService: ProductService,
        private storage: FileStorage,
        private logger: Logger,
        private broker: MessageProducerBroker,
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

        // Image Upload
        const image = req.files?.image as UploadedFile | undefined;
        if (!image) {
            return next(createHttpError(400, "Image is required"));
        }

        const imageName = uuidv4();
        await this.storage.upload({
            fileName: imageName,
            fileData: bufferToArrayBuffer(image?.data),
        });

        // Parse and validate the request body
        const {
            name,
            description,
            priceConfiguration,
            attributes,
            tenantId,
            categoryId,
            isPublish,
        } = req.body as Product;

        const product: Product = {
            name,
            description,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            priceConfiguration: JSON.parse(priceConfiguration),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            attributes: JSON.parse(attributes),
            tenantId,
            categoryId,
            isPublish: Boolean(isPublish),
            image: imageName,
        };

        const newProduct = await this.productService.createProduct(product);
        this.logger.info("Product Created", { id: newProduct?._id });

        // send Product to kafka
        await this.broker.sendMessage(
            "product",
            JSON.stringify({
                id: newProduct?._id,
                priceConfiguration: newProduct?.priceConfiguration,
            }),
        );

        res.json({ id: newProduct?._id });
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
        const productIdParam = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productIdParam)) {
            return next(createHttpError(400, "Invalid request"));
        }

        const productId = new mongoose.Types.ObjectId(productIdParam);
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
                fileData: bufferToArrayBuffer(image?.data),
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            priceConfiguration: JSON.parse(priceConfiguration),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            attributes: JSON.parse(attributes),
            tenantId,
            categoryId,
            isPublish,
            image: (imageName as string) ?? (oldImage as string),
        };

        const updatedProduct = await this.productService.updateProduct(
            productId,
            productToUpdate as Product,
        );

        // send Product to kafka
        await this.broker.sendMessage(
            "product",
            JSON.stringify({
                id: updatedProduct?._id,
                priceConfiguration: updatedProduct?.priceConfiguration,
            }),
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
            {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : 10,
            },
        );

        const finalProducts = (products.data as Product[]).map(
            (product: Product) => {
                return {
                    ...product,
                    image: this.storage.getObjectUri(product.image),
                };
            },
        );

        res.json({
            data: finalProducts,
            total: products.total,
            pageSize: products.limit,
            currentPage: products.page,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const productId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(createHttpError(400, "Invalid Request"));
        }

        const product = await this.productService.getProduct(
            new mongoose.Types.ObjectId(productId),
        );

        this.logger.info("Get product by id", { id: product?._id });

        res.json(product);
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return next(createHttpError(400, "Invalid product ID"));
        }

        const objectId = new mongoose.Types.ObjectId(productId);
        const deletedProduct = await this.productService.delete(objectId);

        if (!deletedProduct) {
            return next(createHttpError(404, "Product not found"));
        }

        if (deletedProduct.image) {
            await this.storage.delete(deletedProduct.image);
        }

        this.logger.info("Product deleted", { id: productId });

        res.status(200).json({
            message: "Product deleted successfully",
            id: productId,
        });
    };
}
