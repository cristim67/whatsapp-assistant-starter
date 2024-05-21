import {GenezioDeploy, GenezioHttpRequest, GenezioHttpResponse, GenezioMethod} from "@genezio/types";
import {GptWorker} from "./gptWorker";
import axios from "axios";

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

  @GenezioMethod({type: "http"})
  async webhook(request: GenezioHttpRequest): Promise<GenezioHttpResponse> {}
  
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
}
