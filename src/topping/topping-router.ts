import { Router } from "express";
import authenticate from "../common/middlewares/authenticate";
import { Roles } from "../common/constants";
import { asyncWrapper } from "../common/utils/wrapper";
import fileUpload from "express-fileupload";
import { canAccess } from "../common/middlewares/canAccess";
import createHttpError from "http-errors";
import toppingValidator from "./topping-validator";
import { ToppingControllers } from "./topping-controllers";
import { ToppingSevice } from "./topping-service";
import { S3Storage } from "../common/services/S3Storage";
import logger from "../config/logger";
import { createMessageProducerBroker } from "../common/factories/brokerFactorie";

const router = Router();

const toppingService = new ToppingSevice();
const storage = new S3Storage();
const broker = createMessageProducerBroker();
const toppingControllers = new ToppingControllers(
    toppingService,
    logger,
    storage,
    broker,
);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 500 * 1024 }, // 500kb
        abortOnLimit: true,
        limitHandler: (req, res, next) => {
            const error = createHttpError(400, "File size exceeds the limit");
            next(error);
        },
    }),
    toppingValidator,
    asyncWrapper(toppingControllers.create),
);

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    fileUpload({
        limits: { fileSize: 500 * 1024 }, // 500kb
        abortOnLimit: true,
        limitHandler: (req, res, next) => {
            const error = createHttpError(400, "File size exceeds the limit");
            next(error);
        },
    }),
    toppingValidator,
    asyncWrapper(toppingControllers.update),
);

router.get("/:id", asyncWrapper(toppingControllers.getOne));
router.get("/", asyncWrapper(toppingControllers.getAll));

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    asyncWrapper(toppingControllers.delete),
);

export default router;
