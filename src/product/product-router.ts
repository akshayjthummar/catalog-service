import { RequestHandler, Router } from "express";
import { asyncWrapper } from "../common/utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { ProductController } from "./product-controller";
import { ProductService } from "./product-service";
import fileUpload from "express-fileupload";
import { S3Storage } from "../common/services/S3Storage";
import createHttpError from "http-errors";
import createProductValidator from "./create-product-validator";
import updateProductValidatorCopy from "./update-product-validator copy";
import logger from "../config/logger";

const router = Router();

const productService = new ProductService();
const s3Storage = new S3Storage();
const productController = new ProductController(
    productService,
    s3Storage,
    logger,
);

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
    createProductValidator,
    asyncWrapper(productController.create),
);

router.put(
    "/:id",
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
    updateProductValidatorCopy,
    asyncWrapper(productController.update),
);

router.get("/", asyncWrapper(productController.index));
router.get(
    "/:id",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    asyncWrapper(productController.getOne),
);

router.delete(
    "/:id",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    asyncWrapper(productController.delete),
);

export default router;
