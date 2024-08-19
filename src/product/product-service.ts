import mongoose from "mongoose";
import ProductModel from "./product-model";
import { Filter, PaginateQuery, Product } from "./product-types";
import { paginationLabels } from "../config/pagination";

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

    async getProduct(productId: mongoose.Types.ObjectId) {
        return (await ProductModel.findOne({ _id: productId })) as Product;
    }

    async getProducts(
        q: string,
        filters: Filter,
        paginateQuery: PaginateQuery,
    ) {
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

        return ProductModel.aggregatePaginate(aggregate, {
            ...paginateQuery,
            customLabels: paginationLabels,
        });
    }

    async delete(productId: mongoose.Types.ObjectId) {
        return (await ProductModel.findByIdAndDelete({
            _id: productId,
        })) as Product;
    }
}
