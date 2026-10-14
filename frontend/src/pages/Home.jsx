import { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import { Link } from 'react-router-dom';
import BooksTable from '../components/home/BooksTable';
import BooksCard from '../components/home/BooksCard';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  HiPlus,
  HiSearch,
  HiOutlineBookOpen,
  HiCurrencyRupee,
  HiViewGrid,
  HiViewList,
} from 'react-icons/hi';
import { ImBooks } from 'react-icons/im';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState('card');
  const [searchQuery, setSearchQuery] = useState('');

  const { manager } = useAuth();

  const fetchBooks = () => {
    setLoading(true);
    api
      .get('/books')
      .then((response) => {
        setBooks(response.data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching books:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();

    const handleBooksUpdated = () => {
      fetchBooks();
    };

    window.addEventListener('books-updated', handleBooksUpdated);
    return () => window.removeEventListener('books-updated', handleBooksUpdated);
  }, []);


  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase().trim();
    return books.filter(
      (book) =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.publishYear?.toString().includes(query)
    );
  }, [books, searchQuery]);


  const stats = useMemo(() => {
    const totalCount = books.length;
    const totalUnits = books.reduce(
      (acc, b) => acc + (b.quantity !== undefined ? Number(b.quantity) : 1),
      0
    );
    const totalPrice = books.reduce(
      (acc, b) => acc + (Number(b.price) || 0) * (b.quantity !== undefined ? Number(b.quantity) : 1),
      0
    );
    const avgPrice = totalCount > 0 ? totalPrice / (totalUnits || 1) : 0;
    return {
      totalCount,
      totalUnits,
      totalPrice: totalPrice.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
    };
  }, [books]);

  return (
    <div className='space-y-8 py-2'>
    
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-800 text-white p-6 sm:p-10 shadow-xl shadow-indigo-950/10'>
     
        <div className='absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none'></div>
        <div className='absolute right-40 -bottom-20 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none'></div>

        <div className='relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className='max-w-xl space-y-2'>
            <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-sky-200'>
              <ImBooks className='text-sm' />
              <span>Welcome, Manager {manager?.name || ''}</span>
            </div>
            <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight'>
              Bookstore Inventory & Catalog
            </h1>
            <p className='text-sm sm:text-base text-indigo-100'>
              Browse books, monitor pricing, view detailed metadata, and manage your full library collection seamlessly.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Link
              to='/books/create'
              className='inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95'
            >
              <HiPlus className='text-lg' />
              <span>Add New Book</span>
            </Link>
          </div>
        </div>

       
        <div className='mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl'>
              <HiOutlineBookOpen />
            </div>
            <div>
              <div className='text-xs text-indigo-200 uppercase tracking-wider'>
                Total Inventory
              </div>
              <div className='text-xl font-bold'>
                {stats.totalCount} <span className='text-xs font-normal text-sky-200'>({stats.totalUnits} units)</span>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl text-emerald-300'>
              <HiCurrencyRupee />
            </div>
            <div>
              <div className='text-xs text-indigo-200 uppercase tracking-wider'>
                Average Price
              </div>
              <div className='text-xl font-bold'>{formatCurrency(stats.avgPrice)}</div>
            </div>
          </div>

          <div className='hidden sm:flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl text-amber-300'>
              <HiCurrencyRupee />
            </div>
            <div>
              <div className='text-xs text-indigo-200 uppercase tracking-wider'>
                Catalog Value
              </div>
              <div className='text-xl font-bold'>{formatCurrency(stats.totalPrice)}</div>
            </div>
          </div>
        </div>
      </div>

     
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm'>
        {/* Search Bar */}
        <div className='relative flex-1 max-w-md'>
          <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
            <HiSearch className='text-lg' />
          </div>
          <input
            type='text'
            placeholder='Search books by title, author, or year...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600'
            >
              Clear
            </button>
          )}
        </div>

    
        <div className='flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60'>
          <button
            onClick={() => setShowType('card')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              showType === 'card'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiViewGrid className='text-base' />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setShowType('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              showType === 'table'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiViewList className='text-base' />
            <span>Table</span>
          </button>
        </div>
      </div>

    
      {loading ? (
        <Spinner message='Fetching bookstore collection...' />
      ) : filteredBooks.length === 0 ? (
        <div className='text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300'>
          <div className='w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4'>
            <HiOutlineBookOpen />
          </div>
          <h3 className='text-lg font-bold text-slate-700'>
            {searchQuery ? 'No matching books found' : 'Your bookstore catalog is empty'}
          </h3>
          <p className='text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6'>
            {searchQuery
              ? `No books match "${searchQuery}". Try searching with a different term.`
              : 'Start building your inventory by creating the first book entry.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className='px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl'
            >
              Clear Search
            </button>
          ) : (
            <Link
              to='/books/create'
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm'
            >
              <HiPlus className='text-lg' />
              <span>Add Your First Book</span>
            </Link>
          )}
        </div>
      ) : showType === 'table' ? (
        <BooksTable books={filteredBooks} />
      ) : (
        <BooksCard books={filteredBooks} />
      )}
    </div>
  );
};

export default Home;
