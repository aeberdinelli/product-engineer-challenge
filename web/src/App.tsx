import { Routes, Route, Link } from 'react-router-dom';
import { AppBar, Box, Container, IconButton, Toolbar, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { PsychiatristsPage } from './pages/PsychiatristsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminPanelSettings, Home } from '@mui/icons-material';

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" component={Link} to="/" sx={{ mr: 2 }}>
            <CalendarMonthIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Psychiatrist Scheduler
            </Typography>
          </IconButton>
          <IconButton color="inherit" component={Link} to="/" sx={{ ml: 1 }}>
            <Home />
            <Typography fontSize="medium" sx={{ ml: 0.5 }}>
              Home
            </Typography>
          </IconButton>
          <IconButton color="inherit" component={Link} to="/admin" sx={{ ml: 1 }}>
            <AdminPanelSettings />
            <Typography fontSize="medium" sx={{ ml: 0.5 }}>
              Admin Page
            </Typography>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<PsychiatristsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
