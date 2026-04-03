/**
 * Auth Middleware
 * - Validates JWT from `Authorization: Bearer <token>` header
 * - Attaches decoded payload to `req.user`
 */
const jwt = require('jsonwebtoken');

/**
 * Authenticate incoming requests using JWT.
 */
const authenciateToken = (req,res,next)=>{
    let token
     if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded; //  THIS IS IMPORTANT
      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token" });
  }
};
module.exports = authenciateToken;
