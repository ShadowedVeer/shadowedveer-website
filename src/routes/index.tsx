import { createFileRoute } from "@tanstack/react-router";
import { LoginPopup } from "@/components/login-popup";
import { ProfileView } from "@/components/profile-view";
import { getPublicProfile } from "@/lib/admin";

export const Route = createFileRoute("/")({
  loader: () => getPublicProfile(),
  component: Home,
});

function Home() {
  const profile = Route.useLoaderData();
  return (
    <>
      <ProfileView profile={profile} />
      <LoginPopup />
    </>
  );
}
