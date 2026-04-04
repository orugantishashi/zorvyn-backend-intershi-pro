const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./model/Data");

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("DB connected");

    // delete existing demo users (optional)
    await User.deleteMany({
      email: { $in: ["admin@gmail.com", "user@gmail.com"] }
    });

    // hash passwords
    const adminPass = await bcrypt.hash("admin123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    // create users
    await User.create([
      {
        name: "Admin",
        email: "admin@gmail.com",
        password: adminPass,
        role: "admin"
      },
      {
        name: "User",
        email: "user@gmail.com",
        password: userPass,
        role: "user"
      }
    ]);

    console.log("Demo users created successfully");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();