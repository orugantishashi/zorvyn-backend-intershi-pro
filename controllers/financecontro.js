/**
 * Finance Controller
 * - Handles CRUD operations for finance records (transactions)
 * - Provides role-based access control for user/admin/analyst
 */
const User = require('../model/Data');
const Finance = require('../model/trancData');
const mongoose = require("mongoose");

/**
 * Create a new finance record for the logged-in user.
 * Analyst: forbidden (read-only role).
 */
exports.createRecord= async(req,res)=>{
    try{
        if (req.user.role === "analyst") {
            return res.status(403).json({ message: "Access denied. Analyst cannot create records." });
        }
       const {amount,typeofamount,category,date,notes,userId}= req.body;
        if(!amount || !typeofamount || !category || !date){
            return res.status(400).json({ message: 'amount,typeofamount,category,date are required' });
        }

        const newRecord = new Finance({
            amount,
            typeofamount,
            category,
            date,
            notes,
            userId: req.user.userid,
        });
        await newRecord.save();
        console.log("Record created successfully");
        res.status(201).json({ message: 'Record created successfully', data: newRecord });


    }catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({ message: 'error while creating record' });
    }  
};

/**
 * Fetch finance records.
 * - user: only own records
 * - admin/analyst: all records
 * Pagination:
 * - default limit is 2 for user/admin
 * - analyst without `limit` gets all records (limit=0 means "no pagination")
 */
exports.getRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const hasLimitParam = req.query.limit !== undefined;
    const parsedLimit = hasLimitParam ? parseInt(req.query.limit) : undefined;

    // If analyst doesn't pass limit, return all records at once
    const limit = Number.isFinite(parsedLimit)
      ? parsedLimit
      : (req.user.role === "analyst" && !hasLimitParam ? 0 : 2);

    const skip = limit === 0 ? 0 : (page - 1) * limit;

    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    let query = {};

    //  Role-based filter
    if (req.user.role === "user") {
      query.userId = req.user.userid;
    }

    //  Total count (filtered)
    const totalRecords = await Finance.countDocuments(query);
    const totalPages = limit === 0 ? 1 : Math.ceil(totalRecords / limit);

    //  Fetch data with pagination + sorting
    let recordsQuery = Finance.find(query).sort(sortObj);
    if (limit !== 0) {
      recordsQuery = recordsQuery.skip(skip).limit(limit);
    }
    const records = await recordsQuery;

    if (records.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    //  Single response
    res.status(200).json({
      message: "Records fetched successfully",
      role: req.user.role,
      page: limit === 0 ? 1 : page,
      limit,
      totalPages,
      totalRecords,
      data: records
    });

  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ message: "Error while fetching records" });
  }
};

/**
 * Delete a finance record.
 * Note: the route is additionally protected by `isAdmin` middleware.
 */
exports.deleteRecord= async(req,res)=>{
    try{
        const recordId = req.params.id;
        const record = await Finance.findById(recordId);
        if(!record){
            return res.status(404).json({ message: 'Record not found' });
        } 
        if(req.user.role !== "admin" && record.userId.toString() !== req.user.userid){
            return res.status(403).json({ message: 'Unauthorized to delete this record' });
        }
        await Finance.findByIdAndDelete(recordId);
        return res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ message: 'Error while deleting record' });
    }
};

/**
 * Update a finance record.
 * - analyst: forbidden (read-only role)
 * - user: can update only own record
 */
exports.updateRecord= async(req,res)=>{
    try{
        if (req.user.role === "analyst") {
            return res.status(403).json({ message: "Access denied. Analyst cannot update records." });
        }
        const recordId = req.params.id;
        const {amount,typeofamount,category,date,notes}= req.body;
        const record = await Finance.findById(recordId);
        if(!record){
            return res.status(404).json({ message: 'Record not found' });
        }
        if( record.userId.toString() !== req.user.userid){
            return res.status(403).json({ message: 'Unauthorized to update this record' });
        } 
        await Finance.findByIdAndUpdate(recordId, {
            amount: amount || record.amount,
            typeofamount: typeofamount || record.typeofamount,  
            category: category || record.category,
            date: date || record.date,
            notes: notes || record.notes,
        }, { new: true });
        res.json({ message: 'Record updated successfully', data: record }); 
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ message: 'Error while updating record' });
    };
};

/**
 * Dashboard analytics for income/expense summaries.
 * - user: only own data
 * - admin/analyst: can see all users; can also scope by `userId`
 * Supports filters: category, type, date range.
 */

exports.dashboard = async (req, res) => {
  try {
    const userId = req.query.userId;
    const category = req.query.category;
    const type = req.query.type;

    //  Get logged-in user details
    const user = await User.findById(req.user.userid);

    let match = {};

    //  Role-based logic
    if ((req.user.role === "admin" || req.user.role === "analyst") && userId) {
     match.userId = new mongoose.Types.ObjectId(userId); // specific user
    } else if (req.user.role === "admin" || req.user.role === "analyst") {
      match = {}; // all users
    } else {
      match.userId = new mongoose.Types.ObjectId(req.user.userid); // own data
    }

    //  Category filter
    if (category) {
      match.category = category;
    }

    //  Type filter (income / expense)
    if (type) {
      match.typeofamount = type;
    }

    //  Date range filter
    if (req.query.startDate && req.query.endDate) {
      match.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    //  Total Income
    const income = await Finance.aggregate([
      { $match: { ...match, typeofamount: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    //  Total Expense
    const expense = await Finance.aggregate([
      { $match: { ...match, typeofamount: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    //  Category-wise Summary
    const categorywise = await Finance.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    //  Recent Transactions
    const recent = await Finance.find(match)
      .sort({ createdAt: -1 })
      .limit(5);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;

    //  Final Response
    res.status(200).json({
      userName: user?.name || "N/A",
      email: user?.email || "N/A",
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categorywise: category,
      recentTransactions: recent
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Dashboard error or token expired"
    });
  }
};
