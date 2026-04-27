import { useState } from 'react';

export const useQuery = (query: string, defaultValue: string) => {
  const [value, setValue] = useState(defaultValue);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramValue = urlSearchParams.get(query);

  return { value: paramValue || value, setValue };
};
