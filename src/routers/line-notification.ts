import request from "request";
import dotenv from "dotenv";

dotenv.config();

const lineNotifyOption = (message: string) => {
  return {
    method: "POST",
    uri: "https://discord.com/api/webhooks/1292733516634652725/DHnUbrzfQjNoIAxfPU5zXey-8rYr0foyf0X1FUw8Ak3gbSCJMPjtXGEJKqJlSMBB28xk",
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
