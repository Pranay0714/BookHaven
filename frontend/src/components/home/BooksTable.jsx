import { Link } from 'react-router-dom';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import { MdOutlineDelete } from 'react-icons/md';
import { formatCurrency } from '../../utils/formatCurrency';

const BooksTable = ({ books }) => {
  return (
    <div className='overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200'>
      <table className='w-full text-left border-collapse'>
        <thead>
          <tr className='bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
            <th className='py-4 px-4 text-center w-16'>No</th>
            <th className='py-4 px-6'>Title</th>
            <th className='py-4 px-6 max-md:hidden'>Author</th>
            <th className='py-4 px-6 max-md:hidden text-center'>Year</th>
            <th className='py-4 px-4 text-center'>Stock</th>
            <th className='py-4 px-6 text-right'>Price</th>
            <th className='py-4 px-6 text-center'>Actions</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100 text-sm text-slate-700'>
          {books.map((book, index) => {
            const qty = book.quantity !== undefined ? Number(book.quantity) : 1;
            const isOutOfStock = qty === 0;

            return (
              <tr
                key={book._id}
                className='hover:bg-slate-50/80 transition-colors'
              >
                <td className='py-4 px-4 text-center font-mono text-xs text-slate-400'>
                  {index + 1}
                </td>
                <td className='py-4 px-6 font-semibold text-slate-900'>
                  <Link
                    to={`/books/details/${book._id}`}
                    className='hover:text-indigo-600 transition-colors'
                  >
                    {book.title}
                  </Link>
                </td>
                <td className='py-4 px-6 text-slate-600 max-md:hidden'>
                  {book.author}
                </td>
                <td className='py-4 px-6 text-center max-md:hidden'>
                  <span className='inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700'>
                    {book.publishYear}
                  </span>
                </td>
                <td className='py-4 px-4 text-center'>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      isOutOfStock
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isOutOfStock ? '0 (Out)' : `${qty} in stock`}
                  </span>
                </td>
                <td className='py-4 px-6 text-right font-bold text-emerald-600'>
                  {formatCurrency(book.price)}
                </td>
                <td className='py-4 px-6'>
                  <div className='flex items-center justify-center gap-2'>
                    <Link
                      to={`/books/details/${book._id}`}
                      title='View Details'
                      className='p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors'
                    >
                      <BsInfoCircle className='text-lg' />
                    </Link>
                    <Link
                      to={`/books/edit/${book._id}`}
                      title='Edit Book / Quantity'
                      className='p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors'
                    >
                      <AiOutlineEdit className='text-xl' />
                    </Link>
                    <Link
                      to={`/books/delete/${book._id}`}
                      title='Delete Book'
                      className='p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors'
                    >
                      <MdOutlineDelete className='text-xl' />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BooksTable;
