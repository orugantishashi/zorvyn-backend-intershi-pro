const finance = require("../model/Data");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Check if user already exists
        const existingUser = await finance.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }   
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser = new finance({
            name,
            email,
            password: hashedPassword,
            role: role || 'user' // Default role is 'user'
        });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Server error during registration" });
    };
};

// Login user and return JWT token  
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await finance.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        } 
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        // Create JWT payload
        const payload = {
            userid: user._id,
            role: user.role
        };  
        // Sign token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    }   
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error during login" });
    }
};  

exports.changePassword = async (req, res) => {
    try{
    const currentPassword  = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const dbpass= await finance.findById(req.user.userid);

    const isMatch= await bcrypt.compare(currentPassword,dbpass.password);
    if(!isMatch){
        return res.status(400).json({ message: "Current password is incorrect" }); 

    };
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await finance.findByIdAndUpdate(req.user.userid,{password:hashedNewPassword});
    res.json({ message: "Password changed successfully" });
}
    catch(error){
        res.status(500).json({ message: "Server error during password change" });
    };
};

//delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {   
        const userId = req.params.id;
        const user = await finance.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   
        await finance.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully" });
    }   
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: "Server error during user deletion" });
    }
};