import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Product name is required")
        .isString()
        .withMessage("Product name should be a string"),
    body("description")
        .exists()
        .withMessage("Description configuration is required"),
    body("priceConfiguration")
        .exists()
        .withMessage("Price Configuration configuration is required"),
    body("tenantId").exists().withMessage("Tenant Id is required"),
    body("categoryId").exists().withMessage("Category Id is required"),
    body("attributes").exists().withMessage("Attributes field is required"),
    body("image").custom((value, { req }) => {
        if (!req.files) throw new Error("Product Image is required");
        return true;
    }),
];
