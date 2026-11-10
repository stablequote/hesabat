const Unit = require('../models/unit.model');

exports.listUnits = async (req, res) => {
  try {
    const units = await Unit.find().sort({ name: 1 });
    return res.status(200).json({ units });
  } catch (error) {
    console.error('listUnits failed:', error);
    return res.status(500).json({ error: 'Failed to fetch units.' });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Unit name is required.' });
    const unit = await Unit.create({ name, abbreviation: req.body.abbreviation });
    return res.status(201).json({ message: 'Unit created.', unit });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A unit with this name already exists.' });
    }
    console.error('createUnit failed:', error);
    return res.status(500).json({ error: 'Failed to create unit.' });
  }
};