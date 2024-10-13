import mongoose from "mongoose";
import toppingModel from "./topping-model";
import { Topping } from "./topping-types";

export class ToppingSevice {
    async create(topping: Topping) {
        return await toppingModel.create(topping);
    }
    async getTopping(toppingId: mongoose.Types.ObjectId) {
        return (await toppingModel.findOne({ _id: toppingId })) as Topping;
    }

    async getAllTopping(tenantId: string) {
        return await toppingModel.find({ tenantId });
    }

    async update(toppingId: mongoose.Types.ObjectId, topping: Topping) {
        return (await toppingModel.findByIdAndUpdate(
            toppingId,
            topping,
        )) as Topping;
    }

    async delete(toppingId: mongoose.Types.ObjectId) {
        return await toppingModel.findByIdAndDelete(toppingId);
    }
}
