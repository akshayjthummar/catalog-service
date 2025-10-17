import { Request } from "express";

export type AuthCookie = {
    accessToken: string;
};

export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
        id?: string;
        tenant: string;
    };
}

export enum ProductEvents {
    PRODUCT_CREATE = "PRODUCT_CREATE",
    PRODUCT_UPDATE = "PRODUCT_UPDATE",
    PRODUCT_DELETE = "PRODUCT_DELETE",
}

export enum ToppingEvents {
    TOPPING_CREATE = "TOPPING_CREATE",
    TOPPING_UPDATE = "TOPPING_UPDATE",
    TOPPING_DELETE = "TOPPING_DELETE",
}
