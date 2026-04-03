const express = require('express');
const app= express();
const connectDB = require('./config/db');
require("dotenv").config();
const authroute = require('./routes/authroute');
const financeRoute = require('./routes/financesRoute');

app.use(express.json());


app.get("/",(req,res)=>{
    res.send("Hello World");
})
app.use('/api/auth', authroute);
app.use('/api/records', financeRoute);


const PORT = process.env.PORT ||  3000;
async function start() {
    await connectDB();

    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    });
}


start().catch((error) => {
    console.error("Failed to start server:", error);
});
