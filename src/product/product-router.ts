import { RequestHandler, Router } from "express";
import { asyncWrapper } from "../common/utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { ProductController } from "./product-controller";
import productValidator from "./product-validator";
import { ProductService } from "./product-service";
import fileUpload from "express-fileupload";
import { S3Storage } from "../common/services/S3Storage";
import createHttpError from "http-errors";

const router = Router();

const productService = new ProductService();
const s3Storage = new S3Storage();
const productController = new ProductController(productService, s3Storage);

router.post(
    "/",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 500 * 1024 }, //500kb
        abortOnLimit: true,
        limitHandler: (req, res, next) => {
            const error = createHttpError(400, "File size exceeds the limits");
            next(error);
        },
    }),
    productValidator,
    asyncWrapper(productController.create),
);

export default router;
