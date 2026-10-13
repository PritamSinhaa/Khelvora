import { Link } from "react-router";
import EditProfilePage from "../../features/profiles/EditProfilePage";

export default function OnboardingPage() {
  return (
    <div className="stack">
      <section className="notice between">
        <span>
          Welcome to the crew. Add your location and a sport to find
          games near you.
        </span>

        <Link
          className="font-bold underline"
          to="/discover"
        >
          Explore first →
        </Link>
      </section>

      <EditProfilePage />
    </div>
  );
}
