import { useToastStore } from '@/src/store/useToastStore';
import { Toast } from './Toast';

export function ToastProvider() {
  const { message, type, visible, hideToast } = useToastStore();
  return <Toast message={message} type={type} visible={visible} onDismiss={hideToast} />;
}
