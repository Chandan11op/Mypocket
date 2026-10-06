const { Person, Transaction } = require('../models');

/**
 * Resolves or creates a counterparty Person for a specific user
 * Enforces per-user uniqueness and prevents duplicates
 * 
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} personName
 * @returns {Promise<{personId: mongoose.Types.ObjectId, personName: string}|null>}
 */
const resolvePersonForUser = async (userId, personName) => {
  if (!personName || !String(personName).trim()) {
    return null;
  }

  const trimmedName = String(personName).trim();
  // Case-insensitive matching regex for lookup to prevent case-variance duplicates
  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let person = await Person.findOne({
    user_id: userId,
    name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
  });

  if (!person) {
    person = await Person.create({
      user_id: userId,
      name: trimmedName,
    });
  }

  return {
    personId: person._id,
    personName: person.name,
  };
};

module.exports = {
  resolvePersonForUser,
};
