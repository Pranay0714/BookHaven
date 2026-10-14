import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PiBookOpenTextLight } from 'react-icons/pi';
import { BiUserCircle, BiShow } from 'react-icons/bi';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import { MdOutlineDelete } from 'react-icons/md';
import { HiCalendar, HiCurrencyRupee, HiArchive } from 'react-icons/hi';
import BookModal from './BookModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { createPortal } from 'react-dom';

const BookSingleCard = ({ book }) => {
  const [showModal, setShowModal] = useState(false);

  const formattedPrice = formatCurrency(book.price);
  const qty = book.quantity !== undefined ? Number(book.quantity) : 1;
  const isOutOfStock = qty === 0;

  return (
    <div className='group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative'>
     
      <div className='h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600'></div>

      <div className='p-5 space-y-4 flex-1'>
   
        <div className='flex items-center justify-between gap-2 flex-wrap'>
          <div className='flex items-center gap-1.5'>
            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
              <HiCalendar className='text-xs' />
              <span>{book.publishYear}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <HiArchive className='text-xs' />
              <span>{isOutOfStock ? 'Out of Stock' : `Qty: ${qty}`}</span>
            </span>
          </div>

          <span className='inline-flex items-center gap-0.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
            <HiCurrencyRupee className='text-sm' />
            <span>{formattedPrice}</span>
          </span>
        </div>

       
        <div>
          <div className='flex items-start gap-3 mb-2'>
            <div className='w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200'>
              <PiBookOpenTextLight className='text-2xl' />
            </div>
            <div className='flex-1 overflow-hidden'>
              <h3 className='font-bold text-slate-800 text-base leading-snug truncate' title={book.title}>
                {book.title}
              </h3>
              <div className='flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate'>
                <BiUserCircle className='text-sm text-slate-400 flex-shrink-0' />
                <span className='truncate'>{book.author}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

  
      <div className='border-t border-slate-100 bg-slate-50/60 px-4 py-3 flex items-center justify-between'>
        <button
          onClick={() => setShowModal(true)}
          title='Quick Preview'
          className='inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer'
        >
          <BiShow className='text-lg' />
          <span>Quick View</span>
        </button>

        <div className='flex items-center gap-1'>
          <Link
            to={`/books/details/${book._id}`}
            title='View Details'
            className='p-1.5 text-sky-600 hover:text-sky-800 hover:bg-white rounded-lg transition-colors'
          >
            <BsInfoCircle className='text-lg' />
          </Link>
          <Link
            to={`/books/edit/${book._id}`}
            title='Edit Book / Quantity'
            className='p-1.5 text-amber-600 hover:text-amber-800 hover:bg-white rounded-lg transition-colors'
          >
            <AiOutlineEdit className='text-lg' />
          </Link>
          <Link
            to={`/books/delete/${book._id}`}
            title='Delete Book'
            className='p-1.5 text-rose-600 hover:text-rose-800 hover:bg-white rounded-lg transition-colors'
          >
            <MdOutlineDelete className='text-lg' />
          </Link>
        </div>
      </div>

      {showModal && (
        createPortal(
          <BookModal book={book} onClose={() => setShowModal(false)} />,
          document.body
        )
      )}
    </div>
  );
};

export default BookSingleCard;
