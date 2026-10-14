import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import {
  HiUser,
  HiCalendar,
  HiCurrencyRupee,
  HiClock,
  HiPencilAlt,
  HiTrash,
  HiArchive,
} from 'react-icons/hi';

const ShowBook = () => {
  const [book, setBook] = useState({});
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/books/${id}`)
      .then((response) => {
        setBook(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [id]);

  const formattedPrice = formatCurrency(book.price);
  const quantity = book.quantity !== undefined ? book.quantity : 1;
  const isOutOfStock = quantity === 0;

  return (
    <div className='max-w-3xl mx-auto py-6'>
      <BackButton destination='/' label='Back to Books' />

      {loading ? (
        <Spinner message='Loading book specifications...' />
      ) : (
        <div className='bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden'>
          {/* Header banner */}
          <div className='bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white relative'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <span className='inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase'>
                    Book Details
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isOutOfStock
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : `In Stock: ${quantity}`}
                  </span>
                </div>
                <h1 className='text-3xl font-extrabold tracking-tight mt-2'>
                  {book.title || 'Book Title'}
                </h1>
                <p className='text-indigo-100 flex items-center gap-1.5 text-base'>
                  <HiUser className='text-lg' />
                  <span>By {book.author || 'Unknown Author'}</span>
                </p>
              </div>

              {/* Price Tag */}
              <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-right'>
                <span className='text-xs text-indigo-100 uppercase tracking-wider block'>
                  Price
                </span>
                <span className='text-3xl font-black text-white'>
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className='p-6 sm:p-8 space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {/* Publication Year */}
              <div className='flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                <div className='w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl flex-shrink-0'>
                  <HiCalendar />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500 uppercase'>
                    Published Year
                  </div>
                  <div className='text-base font-bold text-slate-800'>
                    {book.publishYear || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Price item */}
              <div className='flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                <div className='w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0'>
                  <HiCurrencyRupee />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500 uppercase'>
                    Retail Price
                  </div>
                  <div className='text-base font-bold text-slate-800'>
                    {formattedPrice}
                  </div>
                </div>
              </div>

              {/* Quantity Stock Item */}
              <div className='flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isOutOfStock
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <HiArchive />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500 uppercase'>
                    Available Stock
                  </div>
                  <div
                    className={`text-base font-bold ${
                      isOutOfStock ? 'text-rose-600' : 'text-slate-800'
                    }`}
                  >
                    {quantity} {quantity === 1 ? 'unit' : 'units'}
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Creation Date */}
              <div className='flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                <div className='w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-2xl flex-shrink-0'>
                  <HiClock />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500 uppercase'>
                    Created At
                  </div>
                  <div className='text-xs font-semibold text-slate-700'>
                    {book.createdAt ? new Date(book.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Updated Date */}
              <div className='flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
                <div className='w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl flex-shrink-0'>
                  <HiClock />
                </div>
                <div>
                  <div className='text-xs font-medium text-slate-500 uppercase'>
                    Last Updated
                  </div>
                  <div className='text-xs font-semibold text-slate-700'>
                    {book.updatedAt ? new Date(book.updatedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className='pt-6 border-t border-slate-200 flex items-center justify-end gap-3'>
              <Link
                to={`/books/edit/${book._id}`}
                className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors'
              >
                <HiPencilAlt className='text-base' />
                <span>Edit Book / Stock</span>
              </Link>
              <Link
                to={`/books/delete/${book._id}`}
                className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors'
              >
                <HiTrash className='text-base' />
                <span>Delete Book</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowBook;
