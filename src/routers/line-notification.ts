import request from "request";
import dotenv from "dotenv";

dotenv.config();

const lineNotifyOption = (name: string,value: any) => {
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
    body: JSON.stringify({
      username: "My Webhook Name",
      avatar_url: "",
      content: "Here is assignments",
      embeds: [
        {
          color: 999999,
          fields: [
            {
              name: name,
              value: value,
            },

          ],
        }],










    }),
  };
};

export default function lineNotification(name: any,value: any) {
  request(lineNotifyOption(name,value), function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}