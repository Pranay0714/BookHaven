import { useState } from 'react';
import BackButton from '../components/BackButton';
import Spinner from '../components/Spinner';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../utils/api';
import { HiExclamation, HiTrash } from 'react-icons/hi';

const DeleteBook = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const handleDeleteBook = () => {
    setLoading(true);
    api
      .delete(`/books/${id}`)
      .then(() => {
        setLoading(false);
        enqueueSnackbar('Book deleted successfully', { variant: 'success' });
        navigate('/');
      })
      .catch((error) => {
        setLoading(false);
        enqueueSnackbar('Failed to delete book', { variant: 'error' });
        console.error(error);
      });
  };

  return (
    <div className='max-w-xl mx-auto py-6'>
      <BackButton destination='/' label='Back to Books' />

      <div className='bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden'>
       
        <div className='bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white'>
          <h1 className='text-2xl font-bold'>Delete Book</h1>
          <p className='text-xs text-rose-100 mt-1'>
            Confirm inventory deletion for book ID: {id}
          </p>
        </div>

        {loading ? (
          <Spinner message='Removing book from database...' />
        ) : (
          <div className='p-8 flex flex-col items-center text-center'>
            <div className='w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mb-4'>
              <HiExclamation />
            </div>

            <h3 className='text-xl font-bold text-slate-800 mb-2'>
              Are you sure you want to delete this book?
            </h3>
            <p className='text-sm text-slate-500 max-w-sm mb-6'>
              This action cannot be undone. This book will be permanently removed from the database and catalog.
            </p>

            <div className='flex items-center gap-3 w-full sm:w-auto'>
              <Link
                to='/'
                className='flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors'
              >
                No, Keep It
              </Link>
              <button
                onClick={handleDeleteBook}
                className='flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl shadow-md shadow-red-200 hover:shadow-lg transition-all active:scale-95 cursor-pointer'
              >
                <HiTrash className='text-base' />
                <span>Yes, Delete Book</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteBook;
