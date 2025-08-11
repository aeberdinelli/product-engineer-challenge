import { DateTime } from 'luxon';

export type Slot = { 
	startUtc: string; 
	endUtc: string; 
	displayStart?: string; 
	displayEnd?: string;
	appointmentType?: 'ONLINE' | 'IN_PERSON';
};

export const toUtcIso = (date: string, timeHHmm: string, zone: string): string => {
    const [hours, minutes] = timeHHmm.split(':').map(Number);
    
    const local = DateTime.fromObject(
        { 
            year: Number(date.slice(0,4)), 
            month: Number(date.slice(5,7)), 
            day: Number(date.slice(8,10)), 
            hour: hours, 
            minute: minutes 
        },
        { zone }
    );
    
    return local.toUTC().toISO() ?? '';
};

export const fromUtcIsoToZoneHHmm = (utcIso: string, zone: string): string => {
    const dt = DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(zone);
    return dt.toFormat('HH:mm');
};

export const weekdayInZone = (date: string, zone: string): string => {
    const dt = DateTime.fromISO(date, { zone });
    return dt.toFormat('EEEE');
};