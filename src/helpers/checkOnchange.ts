import lineNotification from "../routers/line-notification";

interface class_activity_pageType {
    [key: string]: {
        title: string | null;
        publish_date: string | null;
        due_date: string | null;
    }[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const lastSentAssignments: { key: string, assignments: string[], timestamp: number }[] = [];

const PUBLISH_DATE_LIMIT = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
const DUE_DATE_LIMIT = 10 * 24 * 60 * 60 * 1000; // 10 days after due date
const TWENTY_MINUTES = 20 * 60 * 1000;
const now = Date.now();

const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr.toLowerCase() === "no due date") return null; // Ignore invalid dates
    try {
        // Remove " at " and replace it with a space so JavaScript can parse it
        const formattedDateStr = dateStr.replace(" at ", " ");
        const parsedDate = new Date(formattedDateStr);

        if (isNaN(parsedDate.getTime())) {
            console.error(`Failed to parse date: ${dateStr}`);
            return null;
        }
        return parsedDate;
    } catch (error) {
        console.error(`Error parsing date: ${dateStr}`);
        return null;
    }
};

export const onChange = async (
    data: class_activity_pageType,
    prev: class_activity_pageType
) => {
    for (const key of Object.keys(data)) {
        const newAssignments = data[key].filter(item => {
            if (!item.title) return false; // Ignore assignments without a title

            const isNewAssignment = prev[key]
                ? !prev[key].some(prevItem => prevItem.title === item.title)
                : true;
            if (!isNewAssignment) return false;

            // Parse publish and due dates
            const publishDate = item.publish_date ? parseDate(item.publish_date) : null;
            const dueDate = item.due_date ? parseDate(item.due_date) : null;

            // If there's no due date, remove it 10 days after publish date
            if (!dueDate && publishDate && publishDate.getTime() < now - PUBLISH_DATE_LIMIT) {
                return false;
            }

            // If there's a due date, remove it 10 days after it has passed
            if (dueDate && dueDate.getTime() < now - DUE_DATE_LIMIT) {
                return false;
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
                    lastSent.assignments = newAssignments.map(item => item.title!);
                } else {
                    lastSentAssignments.push({ key: lastSentKey, assignments: newAssignments.map(item => item.title!), timestamp: now });
                }
                await delay(1000); // Delay of 1 second
            }
        }
    }
};
