import { RequestHandler, Router } from "express";
import { asyncWrapper } from "../common/utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";
import { ProductController } from "./product-controller";
import productValidator from "./product-validator";
import { ProductService } from "./product-service";
import fileUpload from "express-fileupload";

const router = Router();

const productService = new ProductService();
const productController = new ProductController(productService);

router.post(
    "/",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload(),
    productValidator,
    asyncWrapper(productController.create),
);

export default router;
