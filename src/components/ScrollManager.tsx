
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollManager = () => {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Only scroll to top if we are navigating to a new page (PUSH) or replacing (REPLACE).
    // If we are going back (POP), we rely on the browser's native scroll restoration.
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, navType]);

  return null;
};

export default ScrollManager;
