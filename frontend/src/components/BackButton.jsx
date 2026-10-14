import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

const BackButton = ({ destination = '/', label = 'Back' }) => {
  return (
    <div className='inline-flex mb-4'>
      <Link
        to={destination}
        className='group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow hover:-translate-x-0.5'
      >
        <HiArrowLeft className='text-lg text-slate-500 group-hover:text-indigo-600 transition-colors' />
        <span>{label}</span>
      </Link>
    </div>
  );
};

export default BackButton;
