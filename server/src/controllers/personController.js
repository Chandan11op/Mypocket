const mongoose = require('mongoose');
const { Person } = require('../models');

/**
 * GET /api/persons
 * Returns all counterparty persons belonging to the authenticated user
 */
const getPersons = async (req, res, next) => {
  try {
    const userId = req.userId;
    const persons = await Person.find({ user_id: userId }).sort({ name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        persons: persons.map((p) => ({
          id: p._id,
          name: p.name,
          created_at: p.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/persons/search?q=rah
 * Autocomplete endpoint returning user-scoped matching persons
 */
const searchPersons = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { q = '', limit = 10 } = req.query;

    const term = String(q).trim();
    if (!term) {
      return res.status(200).json({
        success: true,
        data: {
          persons: [],
        },
      });
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const limitNum = Math.min(25, Math.max(1, parseInt(limit, 10)));

    const matchingPersons = await Person.find({
      user_id: userId,
      name: { $regex: new RegExp(escapedTerm, 'i') },
    })
      .limit(limitNum)
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        persons: matchingPersons.map((p) => ({
          id: p._id,
          name: p.name,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPersons,
  searchPersons,
};
