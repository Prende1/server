const Word = require('../models/Word');

// Create a new word
exports.createWord = async (req, res) => {
  try {
    const { title, type, category } = req.body;

    const word = new Word({ title, type, category });
    await word.save();

    res.status(201).json({ message: 'Word created successfully', word });
  } catch (error) {
    res.status(400).json({ message: 'Error creating word', error: error.message });
  }
};

// Update an existing word
exports.updateWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, category } = req.body;

    const updatedWord = await Word.findByIdAndUpdate(
      id,
      { title, type, category },
      { new: true, runValidators: true }
    );

    if (!updatedWord) {
      return res.status(404).json({ message: 'Word not found' });
    }

    res.status(200).json({ message: 'Word updated successfully', word: updatedWord });
  } catch (error) {
    res.status(400).json({ message: 'Error updating word', error: error.message });
  }
};


exports.getAllWords = async (req, res) => {
  try {
    const words = await Word.find();
    res.status(200).json(words);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching words', error: error.message });
  }
};

// Get Single Word
exports.getWordById = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);

    if (!word) {
      return res.status(404).json({ message: 'Word not found' });
    }

    res.status(200).json(word);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching word', error: error.message });
  }
};

// Delete Word
exports.deleteWord = async (req, res) => {
  try {
    const word = await Word.findByIdAndDelete(req.params.id);

    if (!word) {
      return res.status(404).json({ message: 'Word not found' });
    }

    res.status(200).json({ message: 'Word deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting word', error: error.message });
  }
};