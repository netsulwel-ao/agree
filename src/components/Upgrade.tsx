import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Upgrade() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/checkout', { replace: true }); }, [navigate]);
  return null;
}
