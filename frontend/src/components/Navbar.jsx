import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ImBooks } from 'react-icons/im';
import { HiPlus, HiLogout, HiLogin, HiUserCircle } from 'react-icons/hi';
import { useSnackbar } from 'notistack';

const Navbar = () => {
  const { manager, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    logout();
    enqueueSnackbar('Logged out successfully', { variant: 'info' });
    navigate('/login');
  };

  return (
    <header className='sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
 
          <Link to='/' className='flex items-center gap-3 group'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform duration-200'>
              <ImBooks className='text-2xl' />
            </div>
            <div>
              <span className='text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent'>
                BookHaven
              </span>
              <span className='hidden sm:block text-xs font-medium text-slate-400 -mt-1'>
                Manager Portal
              </span>
            </div>
          </Link>


          <div className='flex items-center gap-2 sm:gap-4'>
            {isAuthenticated ? (
              <div className='flex items-center gap-3'>
                <Link
                  to='/'
                  className='px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-100/70 transition-colors'
                >
                  Books
                </Link>
                <Link
                  to='/books/create'
                  className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 hover:shadow-md transition-all duration-200 active:scale-95'
                >
                  <HiPlus className='text-base' />
                  <span>Add Book</span>
                </Link>
                <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl'>
                  <HiUserCircle className='text-xl text-indigo-600' />
                  <div className='text-left leading-tight'>
                    <div className='text-xs font-semibold text-slate-800'>
                      {manager?.name || 'Manager'}
                    </div>
                    <div className='text-[10px] font-medium text-indigo-600 uppercase tracking-wider'>
                      Manager
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title='Logout'
                  className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors'
                >
                  <HiLogout className='text-base' />
                  <span className='hidden sm:inline'>Logout</span>
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors'
                >
                  <HiLogin className='text-base' />
                  <span>Manager Login</span>
                </Link>
                <Link
                  to='/register'
                  className='inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors'
                >
                  <span>Create account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
