import ProductModel from "./product-model";
import { Product } from "./product-types";

export class ProductService {
    async createProduct(product: Product) {
        return await ProductModel.create(product);
    }
}
