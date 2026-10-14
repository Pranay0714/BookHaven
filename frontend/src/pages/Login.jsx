import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import { ImBooks } from 'react-icons/im';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      login(response.data.token, response.data.user);
      enqueueSnackbar(`Welcome back, ${response.data.user.name}!`, {
        variant: 'success',
      });
      navigate('/');
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-[85vh] flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8'>
    
        <div className='text-center mb-8'>
          <div className='w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-4'>
            <ImBooks className='text-3xl' />
          </div>
          <h2 className='text-2xl font-bold text-slate-800'>Manager Sign In</h2>
          <p className='text-sm text-slate-500 mt-1'>
            Log in to manage books, inventory, and prices
          </p>
        </div>

        {errorMsg && (
          <div className='mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2'>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className='space-y-5'>
    
          <div>
            <label className='block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <HiMail className='text-xl' />
              </div>
              <input
                type='email'
                required
                placeholder='manager@bookstore.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
              />
            </div>
          </div>

          
          <div>
            <label className='block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2'>
              Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <HiLockClosed className='text-xl' />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors'
              >
                {showPassword ? (
                  <HiEyeOff className='text-xl' />
                ) : (
                  <HiEye className='text-xl' />
                )}
              </button>
            </div>
          </div>

     
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer'
          >
            {loading ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In as Manager</span>
            )}
          </button>
        </form>

     
        <div className='mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600'>
          <span>Don't have an account? </span>
          <Link
            to='/register'
            className='font-semibold text-indigo-600 hover:text-indigo-700 transition-colors'
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
