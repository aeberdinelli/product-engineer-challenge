import { useEffect, useState } from 'react';
import {
  Button, Paper, Stack, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';
import { approveAppointment, rejectAppointment, listAppointments, type Appointment } from '../api';
import { CheckCircle, Refresh } from '@mui/icons-material';

export function AdminPage() {
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAppointments();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (appointmentId: string) => {
    setMsg({});
    try {
      await approveAppointment(appointmentId.trim());
      setMsg({ ok: `Approved ${appointmentId}` });
      await load();
    } catch {
      setMsg({ err: 'Failed to approve appointment' });
    }
  };

  const reject = async (appointmentId: string) => {
    setMsg({});
    try {
      await rejectAppointment(appointmentId.trim());
      setMsg({ ok: `Rejected ${appointmentId}` });
      await load();
    } catch {
      setMsg({ err: 'Failed to reject appointment' });
    }
  };

  const statusChip = (s: Appointment['status']) => {
    if (s === 'APPROVED') {
      return <Chip label="Approved" color="success" size="small" />;
    }

    if (s === 'REJECTED') {
      return <Chip label="Rejected" color="error" size="small" />;
    }
    
    return <Chip label="Pending" color="warning" size="small" />;
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">All Appointments</Typography>
          <Button onClick={load} disabled={loading} variant="outlined">
            <Refresh sx={{ mr: 0.5 }} />
            Refresh
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Appointment</strong>
                </TableCell>
                <TableCell>
                  <strong>Psychiatrist</strong>
                </TableCell>
                <TableCell>
                  <strong>Type</strong>
                </TableCell>
                <TableCell>
                  <strong>Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Time</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.psychiatristName || r.psychiatristId}</TableCell>
                  <TableCell>{r.appointmentType === 'ONLINE' ? 'Online' : 'In person'}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.startTime}–{r.endTime}</TableCell>
                  <TableCell>{statusChip(r.status)}</TableCell>
                  <TableCell align="right">
                    {(r.status === 'PENDING') ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" color="primary" onClick={() => approve(r.id)}>
                          <CheckCircle sx={{ mr: 0.5 }} />
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => reject(r.id)}>
                          Reject
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No actions available
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography>No appointments.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {msg.ok && (
          <Typography color="success.main" sx={{ mt: 2 }}>
            {msg.ok}
          </Typography>
        )}
        {msg.err && (
          <Typography color="error.main" sx={{ mt: 2 }}>
            {msg.err}
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
