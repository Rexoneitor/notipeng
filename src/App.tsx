import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Desk } from './pages/Desk';
import { Inbox } from './pages/Inbox';
import { Journal } from './pages/Journal';
import { Notes } from './pages/Notes';
import { Ideas } from './pages/Ideas';
import { EntryPage } from './pages/EntryPage';
import { Projects } from './pages/Projects';
import { ProjectView } from './pages/ProjectView';
import { Tasks } from './pages/Tasks';
import { Goals } from './pages/Goals';
import { GoalView } from './pages/GoalView';
import { Calendar } from './pages/Calendar';
import { TagsPage, TagView, AreaView } from './pages/Tags';
import { Recent } from './pages/Recent';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Share } from './pages/Share';
import { NotFound } from './pages/NotFound';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Desk /> },
      { path: '/bandeja', element: <Inbox /> },
      { path: '/diario', element: <Journal /> },
      { path: '/notas', element: <Notes /> },
      { path: '/ideas', element: <Ideas /> },
      { path: '/e/:id', element: <EntryPage /> },
      { path: '/proyectos', element: <Projects /> },
      { path: '/proyectos/:id', element: <ProjectView /> },
      { path: '/tareas', element: <Tasks /> },
      { path: '/objetivos', element: <Goals /> },
      { path: '/objetivos/:id', element: <GoalView /> },
      { path: '/calendario', element: <Calendar /> },
      { path: '/etiquetas', element: <TagsPage /> },
      { path: '/etiqueta/:tag', element: <TagView /> },
      { path: '/area/:id', element: <AreaView /> },
      { path: '/recientes', element: <Recent /> },
      { path: '/ajustes', element: <Settings /> },
      { path: '/perfil', element: <Profile /> },
      { path: '/capturar', element: <Share /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
