import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateBook from './pages/CreateBooks';
import ShowBook from './pages/ShowBook';
import EditBook from './pages/EditBook';
import DeleteBook from './pages/DeleteBook';
import Login from './pages/Login';
import Register from './pages/Register';
import GeminiAssistant from './components/GeminiAssistant';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate to='/login' replace />;
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white relative'>
      <Navbar />
      <main className='flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path='/' element={<Home />} />
            <Route path='/books/create' element={<CreateBook />} />
            <Route path='/books/details/:id' element={<ShowBook />} />
            <Route path='/books/edit/:id' element={<EditBook />} />
            <Route path='/books/delete/:id' element={<DeleteBook />} />
          </Route>
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </main>
      <footer className='py-6 border-t border-slate-200 text-center text-xs text-slate-500'>
        <p>© {new Date().getFullYear()} BookHaven Management System • Built with MERN Stack</p>
      </footer>

      {/* Floating Gemini AI Circle Button and Assistant (available after login) */}
      {isAuthenticated && <GeminiAssistant />}
    </div>
  );
};

export default App;
