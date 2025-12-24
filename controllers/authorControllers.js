const Author = require('../models/authorModel');
const { validationResult } = require('express-validator');

const createAuthor = async (req, res) => {
  try { 
    const { firstName, middleName, lastName } = req.body;
    const photo = req.file ? req.file.filename : '';

    if (!firstName || !lastName || !photo) {
      return res.status(400).json({ success: false, error: 'First name, last name, and photo are required' });
    }

    const newAuthor = await Author.create({ firstName, middleName, lastName, photo });

    res.json({ success: true, message: 'Author created successfully', author: newAuthor });
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getAllAuthors = async (req, res) => {
  try {
    const allAuthors = await Author.find();
    res.json({ success: true, authors: allAuthors });
  } catch (error) {
    console.error('Error getting all authors:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const authorId = req.params.id;
    const author = await Author.findById(authorId);

    if (!author) {
      return res.status(404).json({ success: false, error: 'Author not found' });
    }

    res.json({ success: true, author });
  } catch (error) {
    console.error('Error getting author by ID:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const { firstName, middleName, lastName } = req.body;
    const photo = req.file ? req.file.filename : '';

    if (!firstName || !lastName || !photo) {
      return res.status(400).json({ success: false, error: 'First name, last name, and photo are required' });
    }

    const updatedAuthor = await Author.findByIdAndUpdate(
      req.params.id,
      { firstName, middleName, lastName, photo },
      { new: true }
    );

    if (!updatedAuthor) {
      return res.status(404).json({ success: false, error: 'Author not found' });
    }

    res.json({ success: true, message: 'Author updated successfully', author: updatedAuthor });
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const deletedAuthor = await Author.findByIdAndDelete(req.params.id);

    if (!deletedAuthor) {
      return res.status(404).json({ success: false, error: 'Author not found' });
    }

    res.json({ success: true, message: 'Author deleted successfully', author: deletedAuthor });
  } catch (error) {
    console.error('Error deleting author:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getAuthorSuggestions = async (req, res) => {
  try {
    const query = req.query.query;
    const regex = new RegExp(query, 'i');

    const suggestions = await Author.find({ $or: [{ firstName: regex }, { lastName: regex }] })
      .select('firstName lastName')
      .limit(5);

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error getting author suggestions:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  getAuthorSuggestions,
};