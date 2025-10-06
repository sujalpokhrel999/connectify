import { Link, useLocation } from 'react-router-dom';

const FormTabs = () => {
  const location = useLocation(); // get current URL path

  return (
    <div className="form-tabs">
      <Link to="/">
        <button
          className={`tab-btn ${location.pathname === '/' ? 'active' : ''}`}
        >
          Login
        </button>
      </Link>

      <Link to="/signup">
        <button
          className={`tab-btn ${location.pathname === '/signup' ? 'active' : ''}`}
        >
          SignUp
        </button>
      </Link>
    </div>
  );
};

export default FormTabs;
