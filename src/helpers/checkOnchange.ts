import lineNotification from "../routers/line-notification";

interface class_activity_pageType {
    [key: string]: {
        title: string | null;
        publish_date: string | null;
        due_date: string | null;
    }[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const lastSentAssignments: { key: string, timestamp: number }[] = [];

export const onChange = async (
    data: class_activity_pageType,
    prev: class_activity_pageType
) => {
    const now = Date.now();
    const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
    const TWENTY_MINUTES = 20 * 60 * 1000;

    // Function to parse "Month Day, Year at HH:mm" format
    const parseDueDate = (dueDateStr: string) => {
        try {
            // Split the date and time components
            const [datePart, timePart] = dueDateStr.split(' at ');

            // Reconstruct the valid Date string
            const validDateStr = `${datePart}, ${timePart}`;
            const parsedDate = new Date(validDateStr);

            if (isNaN(parsedDate.getTime())) {
                console.error(`Failed to parse due date: ${dueDateStr}`);
                return null;
            }
            return parsedDate;
        } catch (error) {
            console.error(`Error parsing due date: ${dueDateStr}`);
            return null;
        }
    };

    for (const key of Object.keys(data)) {
        const newAssignments = data[key].filter(item => {
            // Check if the assignment exists in previous data
            const isNewAssignment = prev[key]
                ? !prev[key].some(prevItem => prevItem.title === item.title)
                : true;

            // Ignore assignments without a valid title
            if (!item.title) {
                return false;
            }

            if (!isNewAssignment) return false;

            // If due_date exists and is a string, parse it
            let dueDate = null;
            if (item.due_date) {
                dueDate = parseDueDate(item.due_date);
            }

            // Ensure the due date is valid and hasn't passed more than 10 days ago
            if (dueDate && dueDate.getTime()) {
                const tenDaysAgo = now - TEN_DAYS_IN_MS;
                if (dueDate.getTime() < tenDaysAgo) {
                    return false; // Ignore assignments that are past the due date by more than 10 days
                }
            }

            return true;
        });

        if (newAssignments.length > 0) {
            const message = newAssignments
                .map(item => `Assignment: ${item.title} | due date: ${item.due_date ?? "No due date specified"}`)
                .join('\n');

            const lastSentKey = `${key}:${message}`;

            const lastSent = lastSentAssignments.find(entry => entry.key === lastSentKey);
            if (!lastSent || (now - lastSent.timestamp) > TWENTY_MINUTES) {
                let formattedMessage = {
                    name: 'Class: ' + key + ' has New Assignments:',
                    value: message
                };
                console.log(formattedMessage);
                await lineNotification('Class: ' + key + ' has Assignments:', message);
                if (lastSent) {
                    lastSent.timestamp = now;
                } else {
                    lastSentAssignments.push({ key: lastSentKey, timestamp: now });
                }
                await delay(1000); // Delay of 1 second
            }
        }
    }
};
