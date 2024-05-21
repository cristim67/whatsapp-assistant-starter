import {OpenAI} from "openai";
import {GenezioDeploy} from "@genezio/types";

@GenezioDeploy()
export class GptWorker {
  OPENAI_API_KEY: string;

  constructor() {}

  async generateResponse(prompt: string): Promise<string | null> {}
}
