import { NotFoundMessage } from "@/components/frontend/not-found-message";

export default function PostNotFound() {
  return (
    <NotFoundMessage
      title="Post not found"
      text="This post doesn't exist, or it hasn't been published yet."
    />
  );
}
