import { createHashRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import RoleGuard from '../components/RoleGuard';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import KanbanBoard from '../features/kanban/KanbanBoard';
import WeeklyBoard from '../features/weekly/WeeklyBoard';
import ProjectsListPage from '../features/projects/ProjectsListPage';
import ProjectDetailPage from '../features/projects/ProjectDetailPage';
import UsersListPage from '../features/users/UsersListPage';
import UserDetailPage from '../features/users/UserDetailPage';

const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RoleGuard />, // any authenticated user
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/kanban', element: <KanbanBoard /> },
          { path: '/weekly', element: <WeeklyBoard /> },
          { path: '/projects', element: <ProjectsListPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/users/:id', element: <UserDetailPage /> }, // self or Admin/Manager (enforced inside + by API)
          {
            element: <RoleGuard roles={['Admin', 'Manager']} />,
            children: [{ path: '/users', element: <UsersListPage /> }]
          }
        ]
      }
    ]
  }
]);

export default router;
