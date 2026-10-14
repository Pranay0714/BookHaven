const Spinner = ({ message = 'Loading, please wait...', fullScreen = false }) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${
        fullScreen ? 'min-h-[75vh]' : 'min-h-[50vh] py-12'
      }`}
    >
      <div className='relative flex items-center justify-center'>

        <div className='absolute w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-pulse'></div>

   
        <div className='w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 border-r-indigo-500 animate-spin'></div>

  
        <div className='absolute w-10 h-10 rounded-full border-2 border-transparent border-b-sky-500 border-l-sky-400 animate-spin' style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>

  
        <div className='absolute w-3 h-3 bg-indigo-600 rounded-full shadow-md animate-ping'></div>
      </div>

      {message && (
        <p className='mt-5 text-sm font-medium text-slate-500 tracking-wide animate-pulse'>
          {message}
        </p>
      )}
    </div>
  );
};

export default Spinner;