import request from "request";
import dotenv from "dotenv";

dotenv.config();

const MAX_FIELD_VALUE_LENGTH = 1024; // Discord's field value character limit

const formatAssignments = (name: string, value: string): { name: string; value: string }[] => {
  const sanitizedAssignments = value.replace(/No Due Date/g, "N/A");
  const assignments = sanitizedAssignments.split("\n");

  const fields: { name: string; value: string }[] = [];
  let currentFieldValue = "";

  assignments.forEach((line) => {
    if ((currentFieldValue + line).length > MAX_FIELD_VALUE_LENGTH) {
      // If field is too long, push current and start a new one
      fields.push({ name, value: currentFieldValue.trim() });
      currentFieldValue = "";
    }
    currentFieldValue += line + "\n";
  });

  if (currentFieldValue.trim() !== "") {
    fields.push({ name, value: currentFieldValue.trim() });
  }

  return fields;
};

const lineNotifyOption = (name: string, value: any) => {
  const webhookUri = process.env.DISCORDWEBHOOK;
  if (!webhookUri) {
    throw new Error("DISCORDWEBHOOK is not defined in the environment variables");
  }

  const embedFields = formatAssignments(name, String(value));

  return {
    method: "POST",
    uri: webhookUri,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "Assignments bot",
      avatar_url: "",
      embeds: [
        {
          color: 0x999999,
          fields: embedFields,
        },
      ],
    }),
  };
};

export default function lineNotification(name: any, value: any) {
  request(lineNotifyOption(name, value), function (error, response, body) {
    if (error) {
      console.error("Error sending notification:", error);
      return;
    }
    console.log("Discord Response:", body);
  });
}
