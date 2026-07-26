import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";

import { createFeedback } from "./api";
import type { CreateFeedbackInput, FeedbackDTO } from "./schemas";

export function useSubmitFeedback() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateFeedbackInput): Promise<FeedbackDTO> => {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing auth token");
      }
      return createFeedback(token, input);
    },
  });
}
