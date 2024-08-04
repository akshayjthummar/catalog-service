import mongoose from "mongoose";
import config from "config";

export const initDB = async () => {
    await mongoose.connect(config.get("database.url"));
};
