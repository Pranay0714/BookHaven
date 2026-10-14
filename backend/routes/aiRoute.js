import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { Book } from '../models/bookModel.js';
import { verifyManager } from '../middleware/authMiddleware.js';
import { GEMINI_API_KEY } from '../config.js';

const router = express.Router();

router.use(verifyManager);

// Helper to sanitize JSON response from Gemini
const cleanAndParseJson = (text) => {
  if (!text) return null;
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Try to extract JSON object substring if surrounded by extra text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        console.error('Failed to parse extracted JSON substring:', innerErr);
      }
    }
    console.error('Failed to parse Gemini JSON output:', cleaned);
    return null;
  }
};

const parseWebBulkAddRequest = (message) => {
  if (!/\b(?:add|insert|create)\b/i.test(message)) return null;

  const countMatch = message.match(/\b(\d{1,2})\s+(?:books?|titles?)\b/i);
  const priceMatch = message.match(
    /\b(?:price|priced|cost|at|for)\s*(?:is\s*)?(?:₹|rs\.?\s*)?(\d+(?:\.\d{1,2})?)/i
  );
  if (!countMatch || !priceMatch) return null;

  const count = Number(countMatch[1]);
  const price = Number(priceMatch[1]);
  if (count < 1 || !Number.isFinite(price) || price < 0) return null;

  const searchQuery = message
    .replace(/\b(?:add|insert|create|please|books?|titles?|from|the|web|online|take|using|use|set|price|priced|cost|at|for|is|that|are|with|and|me|some)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d{1,2})?\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);

  return searchQuery ? { count, price, searchQuery } : null;
};

const findWebBooks = async (searchQuery, existingBooks, count) => {
  const normalizedQuery = /\b(?:calm|calmful|peace|peaceful|relax|relaxing)\b/i.test(searchQuery)
    ? `${searchQuery} peaceful calming mindfulness meditation`
    : searchQuery;
  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: '100',
    fields: 'key,title,author_name,first_publish_year',
  });
  const response = await fetch(
    `https://openlibrary.org/search.json?${params.toString()}`,
    {
      headers: { 'User-Agent': 'BookHavenManagement/1.0' },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`Open Library search failed with status ${response.status}`);
  }

  const result = await response.json();
  const existingTitles = new Set(existingBooks.map((book) => book.title.trim().toLowerCase()));
  const selectedBooks = [];

  for (const item of result.docs || []) {
    const title = item.title?.trim();
    const author = item.author_name?.[0]?.trim();
    const year = item.first_publish_year;
    const normalizedTitle = title?.toLowerCase();

    if (
      !title ||
      !author ||
      !Number.isInteger(year) ||
      /\b(?:notebook|sketchbook|coloring|colouring|journal|workbook|planner)\b/i.test(title) ||
      existingTitles.has(normalizedTitle) ||
      selectedBooks.some((book) => book.title.toLowerCase() === normalizedTitle)
    ) {
      continue;
    }

    selectedBooks.push({ title, author, publishYear: year });
    if (selectedBooks.length === count) break;
  }

  return selectedBooks;
};

// GET /ai/status - Check if Gemini API key is configured
router.get('/status', async (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || GEMINI_API_KEY);
  return res.status(200).json({
    hasServerKey: hasKey,
    recommendedModel: 'gemini-3.1-flash-lite',
  });
});

// POST /ai/chat - Process user queries with Gemini
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], mood } = req.body;
    const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const activeKey = clientKey || process.env.GEMINI_API_KEY || GEMINI_API_KEY;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 1. Fetch current bookstore inventory for rich context
    const allBooks = await Book.find({}).sort({ createdAt: -1 });
    const availableBooks = allBooks.filter((book) => Number(book.quantity ?? 1) > 0);

    const webBulkAddRequest = parseWebBulkAddRequest(message);
    if (webBulkAddRequest) {
      if (webBulkAddRequest.count > 20) {
        return res.status(200).json({
          success: false,
          reply: 'For reliability, please add no more than 20 web-sourced books in one request.',
          action: 'NONE',
        });
      }

      const webBooks = await findWebBooks(
        webBulkAddRequest.searchQuery,
        allBooks,
        webBulkAddRequest.count
      );
      if (!webBooks.length) {
        return res.status(200).json({
          success: false,
          reply: `I couldn't find any new books with verified title, author, and publication year for "${webBulkAddRequest.searchQuery}". No books were added.`,
          action: 'NONE',
        });
      }

      const addedBooks = await Book.create(
        webBooks.map((book) => ({ ...book, price: webBulkAddRequest.price, quantity: 1 }))
      );
      const partialMessage =
        addedBooks.length < webBulkAddRequest.count
          ? ` I found only ${addedBooks.length} eligible new books, so I added those rather than inventing the remaining details.`
          : '';

      return res.status(200).json({
        success: true,
        reply: `Found and added ${addedBooks.length} books from Open Library about "${webBulkAddRequest.searchQuery}" at ₹${webBulkAddRequest.price} each.${partialMessage}`,
        action: 'ADD_BOOKS',
        actionData: { books: webBooks },
        addedBook: addedBooks.length === 1 ? addedBooks[0] : null,
        addedBooks,
        matchedBooks: [],
        refreshBooks: true,
      });
    }

    if (!activeKey || !activeKey.trim()) {
      return res.status(200).json({
        success: false,
        requiresApiKey: true,
        reply:
          '⚠️ **Gemini API Key Required**\n\nA Gemini API key is not configured. Add `GEMINI_API_KEY=your_key` to `backend/.env`, or enter your API key using the **Settings (⚙️)** button.\n\nYou can create a free API key in Google AI Studio: https://aistudio.google.com/app/apikey',
        action: 'CONFIG_REQUIRED',
      });
    }

    const inventoryContext = allBooks.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      author: b.author,
      publishYear: b.publishYear,
      price: b.price,
      quantity: b.quantity !== undefined ? b.quantity : 1,
    }));
    const availableInventoryContext = availableBooks.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      publishYear: book.publishYear,
      price: book.price,
      quantity: book.quantity !== undefined ? book.quantity : 1,
    }));

    const totalBooks = allBooks.length;
    const totalUnits = allBooks.reduce((sum, b) => sum + (Number(b.quantity) || 1), 0);
    const totalPrice = allBooks.reduce((sum, b) => sum + (Number(b.price) || 0) * (Number(b.quantity) || 1), 0);
    const avgPrice = totalBooks > 0 ? (totalPrice / (totalUnits || 1)).toFixed(2) : 0;

    // 2. Prepare System Instruction
    const systemInstruction = `
You are "BookHaven AI", the intelligent, friendly, and helpful AI Bookstore Assistant for the BookHaven Management System.
You assist the bookstore manager with:
1. Finding and searching books in the bookstore inventory.
2. Adding new books into the bookstore database (including stock quantity).
3. Giving mood-based and interest-based book recommendations.
4. Analyzing inventory statistics (total titles, stock quantity, average price, catalog value).
5. General book knowledge, summaries, quotes, and author info.

CURRENT STORE INVENTORY:
- Unique Titles: ${totalBooks}
- Total Stock Units: ${totalUnits}
- Total Catalog Value: ₹${totalPrice}
- Average Price per Unit: ₹${avgPrice}
- Books list (JSON):
${JSON.stringify(inventoryContext, null, 2)}

LANGUAGE:
- Always respond in clear, friendly English, regardless of the language used in the user's message.

CORE ACTIONS & RESPONSE FORMAT:
You MUST respond ONLY in valid JSON matching this exact structure:
{
  "reply": "Your friendly conversational response formatted with markdown (bullet points, bold text, emojis).",
  "action": "NONE" | "ADD_BOOK" | "ADD_BOOKS" | "SHOW_BOOKS" | "MOOD_RECOMMENDATION",
  "actionData": {
    // If action is ADD_BOOK:
    // { "title": "Book Title", "author": "Author Name", "publishYear": 2023, "price": 499, "quantity": 1 }

    // If action is ADD_BOOKS:
    // { "books": [{ "title": "...", "author": "...", "publishYear": 2023, "price": 499, "quantity": 1 }] }
    
    // If action is SHOW_BOOKS:
    // { "bookIds": ["id1", "id2"], "searchQuery": "query" }
    
    // If action is MOOD_RECOMMENDATION:
    // { "mood": "...", "recommendations": [ { "reason": "...", "bookId": "exact available inventory id" } ] }
  }
}

CRITICAL RULES FOR "ADD_BOOK":
- Trigger action="ADD_BOOK" ONLY when the manager clearly asks to add a book (e.g., "Add book Harry Potter by J.K. Rowling, 1997, 499" or "Add 5 copies of Wings of Fire, APJ Abdul Kalam, 1999, 250").
- If title, author, publishYear, and price are given, set action="ADD_BOOK". If user specifies quantity (e.g., "5 copies", "quantity 10"), set quantity (number). Otherwise default quantity to 1.
- If the manager clearly asks to add multiple distinct books and gives the title, author, publish year, and price for each, set action="ADD_BOOKS" and return every book in actionData.books. Each quantity defaults to 1 unless specified.
- Never add books from a general recommendation request. Ask for any missing required details before adding.
- If the user says "Add book XYZ" but hasn't provided author, year, or price, set action="NONE" and politely ask for the missing details in your reply.

CRITICAL RULES FOR "SHOW_BOOKS":
- If the user asks whether a book or author exists in the store (e.g. "Kya hamare paas Harry Potter hai?", "Find books under 300", "Show books by George Orwell"):
- Check the CURRENT STORE INVENTORY.
- If matches exist, include their exact IDs in actionData.bookIds and set action="SHOW_BOOKS".
- If not in inventory, state that it's not currently in stock, but recommend external titles or suggest adding it.

CRITICAL RULES FOR "MOOD_RECOMMENDATION":
- If the user specifies an emotion or mood (e.g. "I am feeling sad, suggest something uplifting", "Weekend chill books", "Motivate me", or clicked mood buttons):
- Set action="MOOD_RECOMMENDATION".
- Recommend up to 4 fitting books ONLY from AVAILABLE BOOKS below. Do not suggest books outside this list or books with zero stock.
- Every recommendation must use the exact id from AVAILABLE BOOKS as bookId. If no available books fit, return an empty recommendations array.

AVAILABLE BOOKS (the only books allowed in mood recommendations):
${JSON.stringify(availableInventoryContext, null, 2)}
`;

    // 3. Prepare Chat Prompt contents
    const conversationHistory = history
      .slice(-6)
      .map((item) => ({
        role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
        parts: [{ text: item.text || item.content || '' }],
      }))
      .filter((item) => item.parts[0].text);

    const userPrompt = mood
      ? `[User selected mood: ${mood}]. ${message}`
      : message;

    const fullContents = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ];

    // 4. Call Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey: activeKey.trim() });

    // Models ordered by highest reliability & compatibility
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ];

    let geminiResponse = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          geminiResponse = await ai.models.generateContent({
            model: modelName,
            contents: fullContents,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: 'application/json',
            },
          });
          if (geminiResponse && geminiResponse.text) {
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`Model ${modelName} (attempt ${attempt}) error:`, err.message);

          // If temporary 503 high-demand spike, brief sleep before retry
          const isSpike =
            err.status === 503 ||
            err.message?.includes('503') ||
            err.message?.includes('high demand') ||
            err.message?.includes('UNAVAILABLE');

          if (isSpike && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          } else {
            // If 404 or other permanent error, break to next model
            break;
          }
        }
      }

      if (geminiResponse && geminiResponse.text) {
        break;
      }
    }

    if (!geminiResponse || !geminiResponse.text) {
      throw lastError || new Error('No response received from Gemini API');
    }

    const parsed = cleanAndParseJson(geminiResponse.text);

    if (!parsed) {
      if (mood) {
        return res.status(200).json({
          success: true,
          reply:
            'I could not verify mood recommendations from the store catalog right now. Please try selecting the mood again.',
          action: 'MOOD_RECOMMENDATION',
          actionData: null,
          matchedBooks: [],
        });
      }

      // Fallback if parsing failed
      return res.status(200).json({
        success: true,
        reply: geminiResponse.text,
        action: 'NONE',
      });
    }

    let finalReply = parsed.reply || 'How can I help you?';
    const responseAction = mood ? 'MOOD_RECOMMENDATION' : parsed.action || 'NONE';
    let addedBook = null;
    let addedBooks = [];
    let matchedBooks = [];
    let refreshBooks = false;

    // 5. Handle one or multiple books requested by the manager.
    if (responseAction === 'ADD_BOOK' || responseAction === 'ADD_BOOKS') {
      const requestedBooks = Array.isArray(parsed.actionData?.books)
        ? parsed.actionData.books
        : parsed.actionData
          ? [parsed.actionData]
          : [];
      const validBooks = Array.isArray(requestedBooks)
        ? requestedBooks.filter((book) => {
            const quantity = book?.quantity === undefined || book.quantity === '' ? 1 : Number(book.quantity);
            return (
              typeof book?.title === 'string' &&
              book.title.trim() &&
              typeof book?.author === 'string' &&
              book.author.trim() &&
              Number.isFinite(Number(book.publishYear)) &&
              Number.isFinite(Number(book.price)) &&
              Number.isFinite(quantity) &&
              quantity >= 0
            );
          })
        : [];

      if (validBooks.length > 0 && validBooks.length === requestedBooks.length) {
        addedBooks = await Book.create(
          validBooks.map((book) => ({
            title: book.title.trim(),
            author: book.author.trim(),
            publishYear: Number(book.publishYear),
            price: Number(book.price),
            quantity: book.quantity === undefined || book.quantity === '' ? 1 : Number(book.quantity),
          }))
        );
        addedBook = addedBooks.length === 1 ? addedBooks[0] : null;
        refreshBooks = true;
        finalReply += `\n\n🎉 **${addedBooks.length === 1 ? 'Book' : `${addedBooks.length} books`} added to your bookstore catalog:**`;
        finalReply += addedBooks
          .map(
            (book) =>
              `\n- **${book.title}** by ${book.author} (${book.publishYear}) — ₹${book.price}, stock: ${book.quantity}`
          )
          .join('');
      } else if (responseAction === 'ADD_BOOKS' || responseAction === 'ADD_BOOK') {
        finalReply += '\n\nPlease provide the title, author, publish year, and price for each book you want to add.';
      }
    }

    // 6. Handle SHOW_BOOKS matched inventory
    if (responseAction === 'SHOW_BOOKS' && parsed.actionData?.bookIds) {
      const ids = parsed.actionData.bookIds;
      matchedBooks = allBooks.filter((b) => ids.includes(b._id.toString()));
    }

    // Mood recommendations are restricted to real, currently in-stock database records.
    if (responseAction === 'MOOD_RECOMMENDATION') {
      const requestedRecommendations = Array.isArray(parsed.actionData?.recommendations)
        ? parsed.actionData.recommendations
        : [];
      const reasonsById = new Map(
        requestedRecommendations
          .filter((recommendation) => recommendation?.bookId)
          .map((recommendation) => [String(recommendation.bookId), recommendation.reason])
      );
      const recommendationIds = new Set(
        requestedRecommendations.map((recommendation) => String(recommendation?.bookId || ''))
      );
      matchedBooks = availableBooks
        .filter((book) => recommendationIds.has(book._id.toString()))
        .slice(0, 4)
        .map((book) => ({
          ...book.toObject(),
          recommendationReason: reasonsById.get(book._id.toString()) || '',
        }));

      finalReply = matchedBooks.length
        ? `Here are some currently available books from our store that may fit your mood:\n${matchedBooks
            .map((book) => `- **${book.title}** by ${book.author}${book.recommendationReason ? ` — ${book.recommendationReason}` : ''}`)
            .join('\n')}`
        : 'I could not find any currently in-stock books in our catalog that fit this mood. Try another mood or check back when more books are available.';
    }

    return res.status(200).json({
      success: true,
      reply: finalReply,
      action: responseAction,
      actionData: parsed.actionData || null,
      addedBook: addedBook,
      addedBooks: addedBooks,
      matchedBooks: matchedBooks,
      refreshBooks: refreshBooks,
    });
  } catch (error) {
    console.error('Error in /ai/chat:', error);
    const errorMessage = error.message || 'Internal server error';

    // Handle common Gemini API errors gracefully without crashing UI
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      return res.status(200).json({
        success: false,
        requiresApiKey: true,
        reply:
          '❌ **Invalid Gemini API Key**\n\nYour Gemini API key is invalid. Enter a valid key in `backend/.env` or in **Settings (⚙️)**.',
        action: 'CONFIG_REQUIRED',
      });
    }

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
      return res.status(200).json({
        success: false,
        reply:
          '⚠️ **Gemini API Rate Limit Reached**\n\nThe API quota has been reached. Please try again later.',
        action: 'NONE',
      });
    }

    if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      return res.status(200).json({
        success: false,
        reply:
          '⚠️ **Google Gemini is experiencing high traffic.**\n\nPlease try again in 5–10 seconds.',
        action: 'NONE',
      });
    }

    return res.status(200).json({
      success: false,
      reply: `⚠️ **AI Request Error:** ${errorMessage}\n\nPlease try again or check your API key.`,
      action: 'NONE',
    });
  }
});

export default router;
