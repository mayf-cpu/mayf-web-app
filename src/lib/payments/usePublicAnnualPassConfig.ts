import {useCallback, useEffect, useState} from 'react';
import {fetchPublicAnnualPassConfig, type PublicAnnualPassConfig} from './publicAnnualPassConfig';

export function usePublicAnnualPassConfig() {
  const [data, setData] = useState<PublicAnnualPassConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetchPublicAnnualPassConfig({signal: controller.signal}).then(config => {
      if (!controller.signal.aborted) setData(config);
    }).catch(error => {
      if (!controller.signal.aborted) {setData(null); setError(error.message);}
    }).finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [revision]);
  return {data, loading, error, retry};
}
