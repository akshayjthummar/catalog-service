import { RequestHandler, Router } from "express";
import { CategoryController } from "./category-controller";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import categoryValidator from "./category-validator";

import { asyncWrapper } from "../common/utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../common/constants";

const router = Router();

const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.create),
);

router.patch(
    "/:id",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.update),
);

router.delete(
    "/:id",
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.delete),
);

router.get("/:id", asyncWrapper(categoryController.getOne));

router.get("/", asyncWrapper(categoryController.getAll));

export default router;
