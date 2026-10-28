import { env } from "cloudflare:workers";
import { handleInquiry } from "../../../lib/inquiry-handler";

export async function POST(request: Request) {
  return handleInquiry(request, env);
}
