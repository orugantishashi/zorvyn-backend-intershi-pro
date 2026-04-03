const {register,login,deleteUser,changePassword}= require('../controllers/authcontro');
const express = require('express'); 
const router = express.Router();
const limiter = require('../middleware/ratelimitingmiddle');
const authenciateToken = require('../middleware/authmiddleware');
const isAdmin = require('../middleware/adminmiddle');

router.post('/register', limiter, register);
router.post('/login', limiter, login);
router.delete('/users/:id', limiter, authenciateToken,isAdmin ,deleteUser);
router.post('/changepassword', limiter, authenciateToken, changePassword);
module.exports = router;
