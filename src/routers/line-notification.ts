import request from "request";
import dotenv from "dotenv";

dotenv.config();

const lineNotifyOption = (message: string) => {
  const webhookUri = process.env.DISCORDWEBHOOK;
  if (!webhookUri) {
    throw new Error("DISCORDWEBHOOK is not defined in the environment variables");
  }
  return {
    method: "POST",
    uri: webhookUri,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({  username: "My Webhook Name",
      avatar_url: "",
      content: message }),
  };
};

export default function lineNotification(data: string) {
  request(lineNotifyOption(data), function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}