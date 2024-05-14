import {OpenAI} from "openai";
import {GenezioDeploy} from "@genezio/types";

@GenezioDeploy()
export class GptWorker {
  OPENAI_API_KEY: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing environment variables")
    }

    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }

  async generateResponse(prompt: string): Promise<string | null> {
    const openai = new OpenAI({
      apiKey: this.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }
    )

    return response.choices[0].message.content;
  }
}