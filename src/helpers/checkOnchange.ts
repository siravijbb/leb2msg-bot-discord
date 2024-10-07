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
    const TWENTY_MINUTES = 20 * 60 * 1000;

    for (const key of Object.keys(data)) {
        const newAssignments = data[key].filter(item => {
            if (prev[key]) {
                return !prev[key].some(prevItem => prevItem.title === item.title);
            }
            return true;
        });

        if (newAssignments.length > 0) {
            const message = newAssignments.map(item => `Assignment: ${item.title} | due date: ${item.due_date}`).join('\n');
            const lastSentKey = `${key}:${message}`;

            const lastSent = lastSentAssignments.find(entry => entry.key === lastSentKey);
            if (!lastSent || (now - lastSent.timestamp) > TWENTY_MINUTES) {
                await lineNotification(`Class: ${key} has New Assignments:\n${message}`);
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