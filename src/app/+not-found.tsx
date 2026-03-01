import { Redirect } from "expo-router";

// Safety fallback: recover to root auth gate instead of showing a dead-end screen.
export default function NotFoundScreen() {
  return <Redirect href="/" />;
}
