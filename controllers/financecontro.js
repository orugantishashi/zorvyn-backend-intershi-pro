/**
 * Finance Controller
 * - Handles CRUD operations for finance records (transactions)
 * - Provides role-based access control for user/admin/analyst
 */
const User = require('../model/Data');
const Finance = require('../model/trancData');
const mongoose = require("mongoose");

const allowedTypes = ['income', 'expense'];
const allowedSortFields = ['createdAt', 'amount', 'category', 'date', 'typeofamount', 'userId'];

const isValidDate = (value) => {
  const parsed = new Date(value);
  return value !== undefined && !Number.isNaN(parsed.getTime());
};

exports.createRecord = async (req, res) => {
  try {
    if (req.user.role === 'analyst') {
      return res.status(403).json({ message: 'Access denied. Analyst cannot create records.' });
    }

    const { amount, typeofamount, category, date, notes } = req.body;

    if (amount === undefined || typeofamount === undefined || !category || !date) {
      return res.status(400).json({ message: 'amount, typeofamount, category, and date are required' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ message: 'amount must be a valid non-negative number' });
    }

    if (!allowedTypes.includes(typeofamount)) {
      return res.status(400).json({ message: 'typeofamount must be either "income" or "expense"' });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'date must be a valid date string' });
    }

    const newRecord = new Finance({
      amount: numericAmount,
      typeofamount,
      category,
      date: new Date(date),
      notes: typeof notes === 'string' ? notes : '',
      userId: req.user.userid,
    });

    await newRecord.save();
    res.status(201).json({ message: 'Record created successfully', data: newRecord });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Error while creating record' });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const hasLimitParam = req.query.limit !== undefined;
    const parsedLimit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;

    if (req.query.limit !== undefined && !Number.isFinite(parsedLimit)) {
      return res.status(400).json({ message: 'limit must be a valid number' });
    }

    const limit = Number.isFinite(parsedLimit)
      ? parsedLimit
      : (req.user.role === 'analyst' && !hasLimitParam ? 0 : 2);

    if (limit < 0) {
      return res.status(400).json({ message: 'limit must be a non-negative number' });
    }

    if (page < 1 && limit !== 0) {
      return res.status(400).json({ message: 'page must be a positive integer' });
    }

    const sortBy = req.query.sortBy || 'createdAt';
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ message: `sortBy must be one of: ${allowedSortFields.join(', ')}` });
    }

    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    let query = {};
    if (req.user.role === 'user') {
      query.userId = req.user.userid;
    }

    if (req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      if (req.user.role === 'admin' || req.user.role === 'analyst') {
        query.userId = req.query.userId;
      } else {
        return res.status(403).json({ message: 'Access denied to query another user records' });
      }
    }

    const skip = limit === 0 ? 0 : (page - 1) * limit;
    const totalRecords = await Finance.countDocuments(query);
    const totalPages = limit === 0 ? 1 : Math.ceil(totalRecords / limit);

    let recordsQuery = Finance.find(query).sort(sortObj);
    if (limit !== 0) {
      recordsQuery = recordsQuery.skip(skip).limit(limit);
    }

    const records = await recordsQuery;

    res.status(200).json({
      message: records.length ? 'Records fetched successfully' : 'No records found',
      role: req.user.role,
      page: limit === 0 ? 1 : page,
      limit,
      totalPages,
      totalRecords,
      data: records
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Error while fetching records' });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const recordId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid record id' });
    }

    const record = await Finance.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (req.user.role !== 'admin' && record.userId.toString() !== req.user.userid) {
      return res.status(403).json({ message: 'Unauthorized to delete this record' });
    }

    await Finance.findByIdAndDelete(recordId);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Error while deleting record' });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    if (req.user.role === 'analyst') {
      return res.status(403).json({ message: 'Access denied. Analyst cannot update records.' });
    }

    const recordId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid record id' });
    }

    const record = await Finance.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (req.user.role !== 'admin' && record.userId.toString() !== req.user.userid) {
      return res.status(403).json({ message: 'Unauthorized to update this record' });
    }

    const updates = {};
    const { amount, typeofamount, category, date, notes } = req.body;

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ message: 'amount must be a valid non-negative number' });
      }
      updates.amount = numericAmount;
    }

    if (typeofamount !== undefined) {
      if (!allowedTypes.includes(typeofamount)) {
        return res.status(400).json({ message: 'typeofamount must be either "income" or "expense"' });
      }
      updates.typeofamount = typeofamount;
    }

    if (category !== undefined) {
      updates.category = category;
    }

    if (date !== undefined) {
      if (!isValidDate(date)) {
        return res.status(400).json({ message: 'date must be a valid date string' });
      }
      updates.date = new Date(date);
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const updatedRecord = await Finance.findByIdAndUpdate(recordId, updates, { new: true });
    res.json({ message: 'Record updated successfully', data: updatedRecord });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Error while updating record' });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const userId = req.query.userId;
    const category = req.query.category;
    const type = req.query.type;

    const user = await User.findById(req.user.userid);
    if (!user) {
      return res.status(404).json({ message: 'Authenticated user not found' });
    }

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'type must be either "income" or "expense"' });
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    if (req.query.startDate && !isValidDate(req.query.startDate)) {
      return res.status(400).json({ message: 'startDate must be a valid date string' });
    }

    if (req.query.endDate && !isValidDate(req.query.endDate)) {
      return res.status(400).json({ message: 'endDate must be a valid date string' });
    }

    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      const end = new Date(req.query.endDate);
      if (start > end) {
        return res.status(400).json({ message: 'startDate must be before or equal to endDate' });
      }
    }

    let match = {};
    if ((req.user.role === 'admin' || req.user.role === 'analyst') && userId) {
      match.userId = new mongoose.Types.ObjectId(userId);
    } else if (req.user.role === 'user') {
      match.userId = new mongoose.Types.ObjectId(req.user.userid);
    }

    if (category) {
      match.category = category;
    }

    if (type) {
      match.typeofamount = type;
    }

    if (req.query.startDate && req.query.endDate) {
      match.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const income = await Finance.aggregate([
      { $match: { ...match, typeofamount: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expense = await Finance.aggregate([
      { $match: { ...match, typeofamount: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const categorywise = await Finance.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const recent = await Finance.find(match)
      .sort({ createdAt: -1 })
      .limit(5);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;

    res.status(200).json({
      userName: user.name,
      email: user.email,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categorywise,
      recentTransactions: recent
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Dashboard error or token expired' });
  }
};
