import request from "request";
import dotenv from "dotenv";

dotenv.config();

const lineNotifyOption = (message: string) => {
  return {
    method: "POST",
    uri: "https://discord.com/api/webhooks/",
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      message: JSON.stringify(message),
    },
  };
};

export default function lineNotification(data: string) {
  request(lineNotifyOption(data), function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}
