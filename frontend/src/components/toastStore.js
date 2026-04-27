import { useCallback, useEffect, useState } from 'react';

let addToast = null;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(current => [...current, { id, msg, type }]);
    setTimeout(() => {
      setToasts(current => current.filter(item => item.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    addToast = pushToast;
    return () => {
      if (addToast === pushToast) addToast = null;
    };
  }, [pushToast]);

  return toasts;
}

export function toast(msg, type = 'info') {
  addToast?.(msg, type);
}
