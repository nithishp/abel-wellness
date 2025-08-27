// Admin setup script - run this once to create the admin user
import { createAdmin } from "../lib/actions/admin.actions.js";

const setupAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "abelwhcc@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Abel2001";
    const adminName = "Admin";

    console.log("Creating admin user...");
    const admin = await createAdmin(adminEmail, adminPassword, adminName);
    console.log("Admin user created successfully:", admin);
  } catch (error) {
    if (error.message.includes("user with this email already exists")) {
      console.log("Admin user already exists!");
    } else {
      console.error("Error creating admin:", error.message);
    }
  }
};

// Run only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdmin();
}

export default setupAdmin;
