import { StudyTask } from '../services/localStorage';

export const generateICS = (task: StudyTask) => {
    // Ensure we have a valid date
    const startDate = new Date(task.dueDate);
    if (isNaN(startDate.getTime())) {
        console.error("Invalid date for task:", task);
        return;
    }

    // Default duration: 1 hour
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Study Companion//EN
BEGIN:VEVENT
UID:${task.id}@studycompanion.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${task.title}
DESCRIPTION:${task.description || 'Study session'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
