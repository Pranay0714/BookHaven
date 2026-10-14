import { useEffect, useRef } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { PiBookOpenTextLight } from 'react-icons/pi';
import { BiUserCircle } from 'react-icons/bi';
import { HiCalendar, HiCurrencyRupee, HiIdentification, HiArchive } from 'react-icons/hi';
import { formatCurrency } from '../../utils/formatCurrency';

const BookModal = ({ book, onClose }) => {
  const closeButtonRef = useRef(null);
  const formattedPrice = formatCurrency(book.price);
  const qty = book.quantity !== undefined ? Number(book.quantity) : 1;
  const isOutOfStock = qty === 0;
  const createdAt = book.createdAt
    ? new Date(book.createdAt).toLocaleString()
    : 'Not available';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement;
    const closeButton = closeButtonRef.current;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButton?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className='fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn'
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='quick-view-title'
        className='relative my-auto flex max-h-[calc(100dvh-2rem)] w-[540px] max-w-full flex-col overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8'
      >
        <button
          onClick={onClose}
          ref={closeButtonRef}
          type='button'
          aria-label='Close book preview'
          className='absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors'
        >
          <AiOutlineClose className='text-xl' />
        </button>

        <div className='mb-5 flex items-center gap-3 pr-12'>
          <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600'>
            <PiBookOpenTextLight className='text-2xl' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-semibold uppercase tracking-wider text-indigo-600'>
              Quick book preview
            </p>
            <h2
              id='quick-view-title'
              className='break-words text-xl font-bold leading-snug text-slate-900'
            >
              {book.title}
            </h2>
          </div>
        </div>

        <div className='mb-5 flex items-center gap-2 text-sm text-slate-600'>
          <BiUserCircle className='text-lg text-slate-400' />
          <span>By {book.author}</span>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div className='flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5'>
            <HiCalendar className='text-2xl text-amber-600' />
            <div>
              <p className='text-[10px] font-medium uppercase tracking-wide text-amber-700'>
                Published
              </p>
              <p className='font-bold text-slate-800 text-sm'>{book.publishYear}</p>
            </div>
          </div>
          <div className='flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5'>
            <HiCurrencyRupee className='text-2xl text-emerald-600' />
            <div>
              <p className='text-[10px] font-medium uppercase tracking-wide text-emerald-700'>
                Price
              </p>
              <p className='font-bold text-slate-800 text-sm'>{formattedPrice}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-3 rounded-xl border p-3.5 ${
              isOutOfStock
                ? 'border-rose-100 bg-rose-50 text-rose-700'
                : 'border-indigo-100 bg-indigo-50 text-indigo-700'
            }`}
          >
            <HiArchive className='text-2xl' />
            <div>
              <p className='text-[10px] font-medium uppercase tracking-wide'>
                Stock
              </p>
              <p className='font-bold text-sm'>
                {isOutOfStock ? '0 units' : `${qty} units`}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-4 flex items-center gap-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-500'>
          <HiIdentification className='text-base text-slate-400 flex-shrink-0' />
          <span className='truncate' title={book._id}>ID: {book._id}</span>
        </div>

        <div className='mt-4 border-t border-slate-100 pt-4'>
          <p className='text-xs font-semibold uppercase tracking-wider text-slate-500'>
            Added to catalog
          </p>
          <p className='mt-1 text-sm text-slate-700'>{createdAt}</p>
        </div>

        <div className='mt-6 flex justify-end border-t border-slate-100 pt-4'>
          <button
            onClick={onClose}
            type='button'
            className='rounded-xl bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
