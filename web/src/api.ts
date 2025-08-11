const API_BASE = import.meta.env.VITE_API_BASE as string;

export type Psychiatrist = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  timezone: string;
  schedule?: any;
  servicesOffered?: ('ONLINE'|'IN_PERSON')[];
};

export type Slot = {
  startUtc: string;
  endUtc: string;
  displayStart?: string;
  displayEnd?: string;
  appointmentType?: 'ONLINE' | 'IN_PERSON';
};

export type Appointment = {
  id: string;
  psychiatristId: string;
  psychiatristName?: string;
  appointmentType?: 'ONLINE' | 'IN_PERSON';
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export async function listAppointments() {
  const res = await fetch(`${API_BASE}/appointments`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch appointments');
  }
  
  return res.json() as Promise<Appointment[]>;
}

export async function listPsychiatrists(params: { specialty?: string; appointmentType?: 'ONLINE'|'IN_PERSON' } = {}) {
  const url = new URL(`${API_BASE}/psychiatrists`);
  
  if (params.specialty) {
    url.searchParams.set('specialty', params.specialty);
  }
  if (params.appointmentType) {
    url.searchParams.set('appointmentType', params.appointmentType);
  }

  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error('Failed to fetch psychiatrists');
  }

  return res.json() as Promise<Psychiatrist[]>;
}

export async function getAvailability(psychiatristId: string, date: string, type: 'ONLINE'|'IN_PERSON'|'ALL' = 'ALL') {
  const url = new URL(`${API_BASE}/psychiatrists/${psychiatristId}/availability`);
  url.searchParams.set('date', date);
  url.searchParams.set('type', type);
  
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error('Failed to fetch availability');
  }

  return res.json() as Promise<Slot[]>;
}

export async function createAppointment(payload: {
  psychiatristId: string;
  appointmentType: 'ONLINE'|'IN_PERSON';
  startUtc: string;
}) {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create appointment');
  }

  return res.json() as Promise<{ id: string; status: string; appointmentType: 'ONLINE'|'IN_PERSON'; slot: Slot }>;
}

export async function approveAppointment(appointmentId: string) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/approve`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    throw new Error('Failed to approve appointment');
  }

  return res.json();
}

export async function rejectAppointment(appointmentId: string) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/reject`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    throw new Error('Failed to reject appointment');
  }

  return res.json();
}
