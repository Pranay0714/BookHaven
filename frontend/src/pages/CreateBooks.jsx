import { useState } from 'react';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  HiBookOpen,
  HiUser,
  HiCalendar,
  HiCurrencyRupee,
  HiCheck,
  HiShieldCheck,
  HiArchive,
} from 'react-icons/hi';

const CreateBooks = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { manager } = useAuth();

  const handleSaveBook = (e) => {
    e?.preventDefault();
    if (!title || !author || !publishYear || price === '') {
      enqueueSnackbar('Please fill in all fields (Title, Author, Year, and Price)', {
        variant: 'warning',
      });
      return;
    }

    if (Number(price) < 0) {
      enqueueSnackbar('Price cannot be negative', { variant: 'warning' });
      return;
    }

    if (Number(quantity) < 0) {
      enqueueSnackbar('Quantity cannot be negative', { variant: 'warning' });
      return;
    }

    const data = {
      title: title.trim(),
      author: author.trim(),
      publishYear: Number(publishYear),
      price: Number(price),
      quantity: quantity === '' ? 1 : Math.max(0, Number(quantity)),
    };

    setLoading(true);
    api
      .post('/books', data)
      .then(() => {
        setLoading(false);
        enqueueSnackbar('Book created successfully!', { variant: 'success' });
        navigate('/');
      })
      .catch((error) => {
        setLoading(false);
        const msg = error.response?.data?.message || 'Failed to create book';
        enqueueSnackbar(msg, { variant: 'error' });
        console.error(error);
      });
  };

  return (
    <div className='max-w-2xl mx-auto py-6'>
      <BackButton destination='/' label='Back to Books' />

      <div className='bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden'>
     
        <div className='bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>Add New Book</h1>
              <p className='text-xs text-indigo-100 mt-1'>
                Enter the details, quantity, and pricing to expand your inventory
              </p>
            </div>
            <div className='hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium'>
              <HiShieldCheck className='text-base text-emerald-300' />
              <span>Manager: {manager?.name}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner message='Saving new book to inventory...' />
        ) : (
          <form onSubmit={handleSaveBook} className='p-6 sm:p-8 space-y-6'>
     
            <div>
              <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>
                Book Title *
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                  <HiBookOpen className='text-xl' />
                </div>
                <input
                  type='text'
                  required
                  placeholder='e.g. To Kill a Mockingbird'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
                />
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>
                Author Name *
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                  <HiUser className='text-xl' />
                </div>
                <input
                  type='text'
                  required
                  placeholder='e.g. Harper Lee'
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
                />
              </div>
            </div>

            {/* Publication, Price & Quantity */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {/* Year */}
              <div>
                <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>
                  Publish Year *
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <HiCalendar className='text-xl' />
                  </div>
                  <input
                    type='number'
                    required
                    min='1000'
                    max='2100'
                    placeholder='e.g. 1960'
                    value={publishYear}
                    onChange={(e) => setPublishYear(e.target.value)}
                    className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>
                  Price (₹ INR) *
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600'>
                    <HiCurrencyRupee className='text-2xl' />
                  </div>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    required
                    placeholder='e.g. 19.99'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>
                  Quantity (Stock) *
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500'>
                    <HiArchive className='text-xl' />
                  </div>
                  <input
                    type='number'
                    min='0'
                    required
                    placeholder='e.g. 5'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
                  />
                </div>
              </div>
            </div>

            <div className='pt-4 flex items-center justify-end gap-3 border-t border-slate-100'>
              <button
                type='button'
                onClick={() => navigate('/')}
                className='px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition-all active:scale-95 cursor-pointer'
              >
                <HiCheck className='text-lg' />
                <span>Save Book</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBooks;