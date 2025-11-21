import { createRoot } from 'react-dom/client';
import PennantGame from './PennantGame';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<PennantGame />);
