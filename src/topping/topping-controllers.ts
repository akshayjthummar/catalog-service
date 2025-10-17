import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { ToppingSevice } from "./topping-service";
import { Logger } from "winston";
import { bufferToArrayBuffer, FileStorage } from "../common/types/storage";
import { NextFunction, Request, Response } from "express";
import { Topping, ToppingEvents } from "./topping-types";
import { v4 as uuidV4 } from "uuid";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { MessageProducerBroker } from "../common/types/broker";

export class ToppingControllers {
    constructor(
        private toppingService: ToppingSevice,
        private logger: Logger,
        private storage: FileStorage,
        private broker: MessageProducerBroker,
    ) {
        // Bind the methods in the constructor
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.getOne = this.getOne.bind(this);
        this.getAll = this.getAll.bind(this);
        this.delete = this.delete.bind(this);
        // Bind other methods here as needed
    }

    async create(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = validationResult(req);

            if (!result.isEmpty()) {
                throw createHttpError(401, result.array()[0].msg as string);
            }

            const image = req.files?.image as UploadedFile;

            if (!image) {
                throw createHttpError(400, "Image is required");
            }

            const imageName = uuidV4();

            await this.storage.upload({
                fileName: imageName,
                fileData: bufferToArrayBuffer(image?.data),
            });

            const { name, price, tenantId } = req.body as Topping;

            const imagewithurl = this.storage.getObjectUri(imageName);

            const toppingObj: Topping = {
                name,
                price,
                image: imagewithurl,
                tenantId,
            };

            const topping = await this.toppingService.create(toppingObj);

            this.logger.info("Topping created", { id: topping._id });

            const brokerMessage = {
                event_type: ToppingEvents.TOPPING_CREATE,
                data: {
                    id: topping?._id,
                    price: topping?.price,
                    tenantId: topping?.tenantId,
                },
            };
            // send Topping to kafka
            await this.broker.sendMessage(
                "topping",
                JSON.stringify(brokerMessage),
                topping?._id?.toString(),
            );

            res.json(topping);
        } catch (error) {
            next(error);
        }
    }

    async update(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // const result = validationResult(req);

            // if (!result.isEmpty()) {
            //     throw createHttpError(401, result.array()[0].msg as string);
            // }

            const toppingIdParam = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(toppingIdParam)) {
                return next(createHttpError(400, "Invalid request"));
            }

            const toppingId = new mongoose.Types.ObjectId(toppingIdParam);

            const topping = await this.toppingService.getTopping(toppingId);

            let imageName: string | undefined;
            let oldImage: string | undefined;

            if (req.files?.image) {
                oldImage = topping.image;
                const image = req.files.image as UploadedFile;
                imageName = uuidV4();
                await this.storage.upload({
                    fileName: imageName,
                    fileData: bufferToArrayBuffer(image?.data),
                });
                await this.storage.delete(oldImage);
            }

            const { name, price, tenantId } = req.body as Topping;

            const imagewithurl = this.storage.getObjectUri(
                (imageName as string) || (oldImage as string),
            );

            const toppingObj: Topping = {
                name,
                price,
                image: imagewithurl,
                tenantId,
            };

            const updatedTopping = await this.toppingService.update(
                toppingId,
                toppingObj,
            );

            this.logger.info("Topping Updated", { id: updatedTopping._id });

            const brokerMessage = {
                event_type: ToppingEvents.TOPPING_UPDATE,
                data: {
                    id: updatedTopping?._id,
                    price: updatedTopping?.price,
                    tenantId: updatedTopping?.tenantId,
                },
            };
            // send topping to kafka
            await this.broker.sendMessage(
                "topping",
                JSON.stringify(brokerMessage),
                updatedTopping?._id?.toString(),
            );

            res.json({ id: updatedTopping._id });
        } catch (error) {
            next(error);
        }
    }

    async getOne(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const toppingIdParam = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(toppingIdParam)) {
                return next(createHttpError(400, "Invalid request"));
            }

            const toppingId = new mongoose.Types.ObjectId(toppingIdParam);

            const topping = await this.toppingService.getTopping(toppingId);

            this.logger.info("Topping Get by id", { id: topping._id });

            res.json(topping);
        } catch (error) {
            next(error);
        }
    }

    async getAll(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const toppings = await this.toppingService.getAllTopping(
                req.query.tenantId as string,
            );

            this.logger.info("Topping Get all");

            res.json(toppings);
        } catch (error) {
            next(error);
        }
    }

    async delete(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const toppingIdParam = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(toppingIdParam)) {
                return next(createHttpError(400, "Invalid request"));
            }

            const toppingId = new mongoose.Types.ObjectId(toppingIdParam);

            const deletedTopping = await this.toppingService.delete(toppingId);

            if (!deletedTopping) {
                return next(createHttpError(404, "Topping not found"));
            }

            if (deletedTopping.image) {
                await this.storage.delete(deletedTopping.image);
            }

            const brokerMessage = {
                event_type: ToppingEvents.TOPPING_DELETE,
                data: {
                    id: deletedTopping?._id,
                },
            };
            // send topping to kafka
            await this.broker.sendMessage(
                "topping",
                JSON.stringify(brokerMessage),
                deletedTopping?._id?.toString(),
            );

            this.logger.info("Topping deleted", { id: deletedTopping._id });

            res.json({ id: deletedTopping._id });
        } catch (error) {
            next(error);
        }
    }
}
