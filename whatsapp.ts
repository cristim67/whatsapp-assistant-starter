import {GenezioDeploy, GenezioHttpRequest, GenezioHttpResponse, GenezioMethod} from "@genezio/types";
import axios from "axios";
import {GptWorker} from "./gptWorker";

@GenezioDeploy()
export class BackendService {
  GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;
  WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
  BUSINESS_PHONE_NUMBER_ID = process.env.BUSINESS_PHONE_NUMBER_ID;
  GPT_WORKER = new GptWorker();

  constructor() {
    if (!this.GRAPH_API_TOKEN || !this.WEBHOOK_VERIFY_TOKEN || !this.BUSINESS_PHONE_NUMBER_ID) {
      throw new Error("Missing environment variables")
    }
  }

  async #sendMessage(message: string, phone: string): Promise<boolean> {
    try {
      console.log("Sending message to", phone)
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${this.BUSINESS_PHONE_NUMBER_ID}/messages`,
        headers: {
          Authorization: `Bearer ${this.GRAPH_API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: {
            preview_url: false,
            body: message
          }
        }
      })
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  @GenezioMethod({type: "http"})
  async webhook(request: GenezioHttpRequest): Promise<GenezioHttpResponse> {
    try {
      if (request.queryStringParameters !== undefined) {
        // Webhook verification by WhatsApp Business API
        const mode = request.queryStringParameters["hub.mode"];
        const token = request.queryStringParameters["hub.verify_token"];
        const challenge = request.queryStringParameters["hub.challenge"];
        if (mode === "subscribe" && token === this.WEBHOOK_VERIFY_TOKEN) {
          console.log("Webhook verified successfully!");
          return {
            headers: {"Content-Type": "application/json"},
            statusCode: "200",
            body: challenge
          }
        } else return {
          headers: {"Content-Type": "application/json"},
          statusCode: "403",
          body: "Forbidden"
        }
      }

      const body = request.body.entry[0].changes[0].value.messages[0].text.body; // Message received


      const response = await this.GPT_WORKER.generateResponse(body);
      if (!response) {
        return {
          headers: {"Content-Type": "application/json"},
          statusCode: "200",
          body: "Message not handled"
        }
      }
      await this.#sendMessage(response, request.body.entry[0].changes[0].value.messages[0].from)

      return {
        headers: {"Content-Type": "application/json"},
        statusCode: "200",
        body: "Message sent"
      }

    } catch (error) {
      console.error(error)
      return {
        headers: {"Content-Type": "application/json"},
        statusCode: "500",
        body: "Internal server error"
      }
    }
  }
}