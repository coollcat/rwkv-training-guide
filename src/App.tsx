import { Routes, Route } from 'react-router';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LessonPage from './pages/LessonPage';
import ResourcesPage from './pages/ResourcesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
