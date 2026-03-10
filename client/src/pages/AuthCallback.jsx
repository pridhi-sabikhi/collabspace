import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      navigate('/login');
      return;
    }

    if (token) {
      loginWithToken(token)
        .then(() => {
          toast.success('Logged in with Google');
          navigate('/dashboard');
        })
        .catch(() => {
          toast.error('Authentication failed');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
  );
}
