import { useEffect, useState } from 'react';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

function isCoarsePointer(): boolean {
  return window.matchMedia?.(COARSE_POINTER_QUERY)?.matches === true;
}

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(isCoarsePointer);

  useEffect(() => {
    const media = window.matchMedia?.(COARSE_POINTER_QUERY);
    if (!media) {
      return;
    }

    function onChange() {
      setCoarse(media.matches);
    }

    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return coarse;
}
