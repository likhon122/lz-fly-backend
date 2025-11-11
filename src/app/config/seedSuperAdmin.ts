import config from ".";
import { User } from "../modules/user/user.model";
import bcrypt from "bcrypt";

const getSuperAdminData = async () => {
  return {
    name: "Super Admin",
    email: config.super_admin_email,
    role: "super_admin",
    password: await bcrypt.hash(
      config.super_admin_password!,
      config.bcrypt_salt_rounds,
    ),
  };
};

const seedSuperAdmin = async () => {
  const existingAdmin = await User.findOne({
    email: config.super_admin_email,
    role: "super_admin",
  });

  if (existingAdmin) {
    return;
  }

  const superAdminData = await getSuperAdminData();
  await User.create(superAdminData);
};

export default seedSuperAdmin;
