import mongoose from "mongoose";
import ProductModel from "./product-model";
import { Filter, Product } from "./product-types";

export class ProductService {
    async createProduct(product: Product): Promise<Product | null> {
        return await ProductModel.create(product);
    }

    async updateProduct(
        productId: mongoose.Types.ObjectId,
        product: Product,
    ): Promise<Product | null> {
        return await ProductModel.findOneAndUpdate(
            { _id: productId },
            { $set: product },
            { new: true },
        );
    }

    async getProduct(
        productId: mongoose.Types.ObjectId,
    ): Promise<Product | null> {
        return await ProductModel.findOne({ _id: productId });
    }

    async getProducts(q: string, filters: Filter) {
        const searchQueryRegexp = new RegExp(q, "i");
        const matchQuery = {
            ...filters,
            name: searchQueryRegexp,
        };
        const aggregate = ProductModel.aggregate([
            {
                $match: matchQuery,
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                attributes: 1,
                                priceConfiguration: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: "$category",
            },
        ]);

        const result = await aggregate.exec();
        return result as Product[];
    }
}
