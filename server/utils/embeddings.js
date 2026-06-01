import { HfInference } from "@huggingface/inference";
import * as dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

export async function textToVector(text) {
  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  const flat = Array.isArray(embedding[0])
    ? embedding[0]
    : Array.from(embedding);
  return flat;
}