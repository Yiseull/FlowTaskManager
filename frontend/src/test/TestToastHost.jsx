import { ToastContainer } from '../components/Toast';
import { useToasts } from '../components/toastStore';

export default function TestToastHost() {
  const toasts = useToasts();
  return <ToastContainer toasts={toasts} />;
}
