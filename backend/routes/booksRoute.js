import express from 'express';
import { Book } from '../models/bookModel.js';
import { verifyManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyManager);

// POST /books - Add a new book
router.post('/', async (request, response) => {
  try {
    if (
      !request.body.title ||
      !request.body.author ||
      !request.body.publishYear ||
      request.body.price === undefined ||
      request.body.price === ''
    ) {
      return response.status(400).send({
        message: 'Send all required fields: title, author, publishYear, price',
      });
    }

    const quantity =
      request.body.quantity !== undefined && request.body.quantity !== ''
        ? Math.max(0, Number(request.body.quantity))
        : 1;

    const newBook = {
      title: request.body.title,
      author: request.body.author,
      publishYear: Number(request.body.publishYear),
      price: Number(request.body.price),
      quantity: quantity,
    };

    const book = await Book.create(newBook);

    return response.status(201).send(book);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// GET /books - List all books
router.get('/', async (request, response) => {
  try {
    const books = await Book.find({});

    return response.status(200).json({
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// GET /books/:id - Get book by ID
router.get('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    const book = await Book.findById(id);

    if (!book) {
      return response.status(404).json({ message: 'Book not found' });
    }

    return response.status(200).json(book);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// PUT /books/:id - Update book details including quantity
router.put('/:id', async (request, response) => {
  try {
    if (
      !request.body.title ||
      !request.body.author ||
      !request.body.publishYear ||
      request.body.price === undefined ||
      request.body.price === ''
    ) {
      return response.status(400).send({
        message: 'Send all required fields: title, author, publishYear, price',
      });
    }

    const { id } = request.params;

    const updateData = {
      title: request.body.title,
      author: request.body.author,
      publishYear: Number(request.body.publishYear),
      price: Number(request.body.price),
    };

    if (request.body.quantity !== undefined && request.body.quantity !== '') {
      updateData.quantity = Math.max(0, Number(request.body.quantity));
    }

    const result = await Book.findByIdAndUpdate(id, updateData, { new: true });

    if (!result) {
      return response.status(404).json({ message: 'Book not found' });
    }

    return response.status(200).send({ message: 'Book updated successfully', data: result });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

// DELETE /books/:id - Delete book
router.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params;

    const result = await Book.findByIdAndDelete(id);

    if (!result) {
      return response.status(404).json({ message: 'Book not found' });
    }

    return response.status(200).send({ message: 'Book deleted successfully' });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
});

export default router;
