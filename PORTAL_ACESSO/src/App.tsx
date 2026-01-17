import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Contact } from './pages/Contact';
import EventProxy from './pages/EventProxy';
import Obrigado from './pages/Obrigado';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/contato" element={<Contact />} />
        <Route path="/event" element={<EventProxy />} />
        <Route path="/obrigado" element={<Obrigado />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
