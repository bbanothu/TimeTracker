import { Redirect } from 'expo-router';

/** @deprecated Use `/settings` — kept for any old links. */
export default function ChangePasswordScreen() {
  return <Redirect href="/settings" />;
}
