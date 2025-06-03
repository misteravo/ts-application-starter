import { useLayoutEffect, useState } from 'react';

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    function updateSize() {
      setIsMobile(!window.innerWidth || window.innerWidth < 768);
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return (): void => window.removeEventListener('resize', updateSize);
  }, []);

  return isMobile;
};
