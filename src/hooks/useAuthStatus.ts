import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Custom Hooks
const useAuthStatus = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLogged(true);
      }
      setCheckingStatus(false);
    });
  }, []);

  return { isLogged, checkingStatus };
};

export default useAuthStatus;
