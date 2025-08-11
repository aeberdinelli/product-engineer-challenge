import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import {
  Box, Chip, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Grid,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Typography,
  Container,
  CircularProgress
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VideocamIcon from '@mui/icons-material/Videocam';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { type Psychiatrist, type Slot, listPsychiatrists, getAvailability, createAppointment } from '../api';

type TypeFilter = '' | 'ONLINE' | 'IN_PERSON' | 'ALL';

const weekDays = (mondayISO: string) => {
  const start = DateTime.fromISO(mondayISO);
  return Array.from({ length: 7 }, (_, i) => start.plus({ days: i }).toISODate()!);
};

export function PsychiatristsPage() {
  const [rows, setRows] = useState<Psychiatrist[]>([]);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [type, setType] = useState<TypeFilter>('');
  const [selected, setSelected] = useState<Psychiatrist | null>(null);
  const [weekStart, setWeekStart] = useState<string>(DateTime.now().startOf('week').plus({ days: 1 }).toISODate()!); // Monday
  const [weekly, setWeekly] = useState<Record<string, Slot[]>>({});
  const [booking, setBooking] = useState<{ slot?: Slot; error?: string; ok?: string }>({});

  const effectiveType: 'ONLINE'|'IN_PERSON'|'ALL' = type === '' ? 'ALL' : type;

  const load = async () => {
    setLoading(true);

    try {
      const list = await listPsychiatrists({
        specialty: specialty || undefined,
        appointmentType: type === '' || type === 'ALL' ? undefined : type
      });
      setRows(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!booking.ok && !booking.error) {
      return;
    }
    const t = setTimeout(() => setBooking({}), 3500);
    return () => clearTimeout(t);
  }, [booking.ok, booking.error]);

  const handleFilter = async () => { await load(); };

  const servicesChips = (p: Psychiatrist) => {
    const includesOnline = p.schedule.online && p.schedule.online.length > 0;
    const includesInPerson = p.schedule.inPerson && p.schedule.inPerson.length > 0;

    return (
      <Stack direction="row" spacing={1}>
        {includesOnline && <Chip icon={<VideocamIcon />} label="Online" size="small" color="primary" />}
        {includesInPerson && <Chip sx={{ pl: 0.5 }} icon={<HomeWorkIcon fontSize="small" sx={{ mr: 2, ml: 2 }} />} label="In person" size="small" color="secondary" />}
      </Stack>
    );
  };

  const fetchWeek = async (p: Psychiatrist) => {
    setSelected(p);
    setWeekly({});
    const days = weekDays(weekStart);
    const results: Record<string, Slot[]> = {};
    for (const d of days) {
      const slots = await getAvailability(p.id, d, effectiveType);
      results[d] = slots;
    }
    setWeekly(results);
  };

  const requestBooking = async (slot: Slot, dayIso: string) => {
    if (!selected || !slot.startUtc || !slot.appointmentType) {
      setBooking({ error: 'Missing required info to book this slot' });
      return;
    }

    setBookingSlotId(slot.startUtc);
    setBooking({});
    setLoading(true);

    try {
      const res = await createAppointment({
        psychiatristId: selected.id,
        appointmentType: slot.appointmentType,
        startUtc: slot.startUtc
      });

      // Remove the just-booked slot from that day list
      setWeekly(prev => {
        const daySlots = prev[dayIso] || [];
        const filtered = daySlots.filter(s => s.startUtc !== slot.startUtc);
        return { ...prev, [dayIso]: filtered };
      });

      setBooking({ ok: `Requested! Appointment ID: ${res.id}` });
    } catch (e: any) {
      setBooking({ error: e?.message || 'Failed to request appointment' });
    } finally {
      setBookingSlotId(null);
      setLoading(false);
    }
  };

  const dayCols = useMemo(() => weekDays(weekStart), [weekStart]);

  return (
    <Grid container spacing={3}>
      <Container>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              size="small"
              label="Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Anxiety, Depression"
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="type-label">Appointment type</InputLabel>
              <Select
                labelId="type-label"
                label="Appointment type"
                value={type}
                onChange={(e) => setType(e.target.value as TypeFilter)}
              >
                <MenuItem value=""><em>(Any)</em></MenuItem>
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="IN_PERSON">In person</MenuItem>
                <MenuItem value="ALL">Both / All</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Week (Monday)"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={handleFilter} disabled={loading}>Search</Button>
            <Box flexGrow={1} />
          </Stack>
        </Paper>
      </Container>

      <Container>
        <TableContainer component={Paper}>
          <Table sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell>Psychiatrist</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Services</TableCell>
                <TableCell width={160} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{p.specialty}</TableCell>
                  <TableCell>{servicesChips(p)}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      startIcon={<EventAvailableIcon />}
                      onClick={() => fetchWeek(p)}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Check availability
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography>No psychiatrists found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {selected && (
        <Container>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Typography variant="h6">Weekly availability</Typography>
              <Typography variant="body2" color="text.secondary">— {selected.name}</Typography>
            </Stack>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    {dayCols.map((d) => (
                      <TableCell key={d} sx={{ whiteSpace: 'nowrap' }}>
                        <strong>{DateTime.fromISO(d).toFormat('ccc dd')}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody
                  sx={{
                    '& .MuiTableCell-root': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <TableRow>
                    {dayCols.map((d) => (
                      <TableCell key={d}>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {(weekly[d] || []).map((slot, idx) => (
                            <Box
                              key={idx}
                              onClick={() => requestBooking(slot, d)}
                              sx={{
                                border: '1px solid',
                                borderColor: slot.appointmentType === 'ONLINE' ? 'primary.main' : 'secondary.main',
                                borderRadius: 1.5,
                                p: 1,
                                cursor: 'pointer',
                                minWidth: 80,
                                textAlign: 'center',
                                '&:hover': {
                                  backgroundColor: '#f0f7f9',
                                  opacity: 0.9
                                }
                              }}
                            >
                              <Stack alignItems="center" spacing={0.5}>
                                {slot.appointmentType === 'ONLINE'
                                  ? <VideocamIcon fontSize="small" color="primary" />
                                  : <HomeWorkIcon fontSize="small" color="secondary" />
                                }
                                <Typography variant="caption" fontWeight={600}>
                                  {slot.appointmentType === 'ONLINE' ? 'Online' : 'In person'}
                                </Typography>
                                <Typography variant="body2">
                                  {slot.displayStart}–{slot.displayEnd}
                                </Typography>

                                {loading && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <CircularProgress size={22} />
                                  </Box>
                                )}
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <Divider sx={{ my: 2 }} />

            {booking.error && <Typography color="error">{booking.error}</Typography>}
            {booking.ok && <Typography color="success.main">{booking.ok}</Typography>}
          </Paper>
        </Container>
      )}
    </Grid>
  );
}
