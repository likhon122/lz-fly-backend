"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const user_model_1 = require("../modules/user/user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getSuperAdminData = () => __awaiter(void 0, void 0, void 0, function* () {
    return {
        name: "Super Admin",
        email: _1.default.super_admin_email,
        role: "super_admin",
        password: yield bcrypt_1.default.hash(_1.default.super_admin_password, _1.default.bcrypt_salt_rounds),
    };
});
const seedSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingAdmin = yield user_model_1.User.findOne({
        email: _1.default.super_admin_email,
        role: "super_admin",
    });
    if (existingAdmin) {
        return;
    }
    const superAdminData = yield getSuperAdminData();
    yield user_model_1.User.create(superAdminData);
});
exports.default = seedSuperAdmin;
