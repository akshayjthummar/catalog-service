import CategoryModel from "./category-model";
import { Category } from "./category-types";

export class CategoryService {
    async create(category: Category) {
        const newCategory = new CategoryModel(category);
        return await newCategory.save();
    }

    async update(id: string, category: Category) {
        const newCategory = await CategoryModel.findByIdAndUpdate(id, category);
        return newCategory;
    }

    async delete(id: string) {
        const newCategory = await CategoryModel.findByIdAndDelete(id);
        return newCategory;
    }

    async getOne(id: string) {
        const newCategory = await CategoryModel.findById(id);
        return newCategory;
    }

    async getAll() {
        const newCategory = await CategoryModel.find();
        return newCategory;
    }
}
