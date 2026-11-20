import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalErrorHandlers } from './utils/runtimeSafety';

initGlobalErrorHandlers();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
