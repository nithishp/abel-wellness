// Admin setup script - run this once to create the admin user
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const setupAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Admin";

    // Validate required environment variables
    if (!adminEmail || !adminPassword) {
      console.error(
        "❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required",
      );
      console.error("Please set them in your .env.local file:");
      console.error("  ADMIN_EMAIL=your-admin@email.com");
      console.error("  ADMIN_PASSWORD=your-secure-password");
      process.exit(1);
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(adminPassword)) {
      console.error("❌ Error: Password must be at least 12 characters with:");
      console.error("  - At least one uppercase letter");
      console.error("  - At least one lowercase letter");
      console.error("  - At least one number");
      console.error("  - At least one special character (@$!%*?&)");
      process.exit(1);
    }

    console.log("🔐 Setting up admin user...");
    console.log("Email:", adminEmail);

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // First, check if user already exists in the database
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .single();

    if (existingUser) {
      console.log("⚠️  Admin user already exists in database!");
      console.log("User ID:", existingUser.id);
      console.log("\nYou can log in with these credentials at /admin/login");
      return;
    }

    // Create user in the database (users table)
    const { data: newUser, error: dbError } = await supabase
      .from("users")
      .insert([
        {
          email: adminEmail,
          full_name: adminName,
          password_hash: hashedPassword,
          role: "admin",
          is_active: true,
        },
      ])
      .select();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("✅ Admin user created successfully in database!");
    console.log("User ID:", newUser[0].id);
    console.log(
      "\n✨ You can now log in with these credentials at /admin/login",
    );
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

// Run the setup
setupAdmin();
