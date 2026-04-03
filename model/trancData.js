/**
 * Finance Transaction Model (MongoDB / Mongoose)
 * - Stores income/expense records with category, date, notes and owner userId
 */
const mongoose = require('mongoose');
const financeSchema = new mongoose.Schema({
    amount:{type:Number, required:true},
    typeofamount:{type:String, 
        enum:['income','expense'], 
        required:true},
    category:{type:String, required:true},
    date:{type:Date, required:true},
    notes:{type:String, required:false},
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true}
},{timestamps:true});
const Finance = mongoose.model('Financedata', financeSchema);
module.exports = Finance;
