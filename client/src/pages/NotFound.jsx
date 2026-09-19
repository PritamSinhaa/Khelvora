import { Link } from "react-router";

export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <p className="font-display text-8xl text-primary">404</p>

      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>

      <p className="mt-3 text-muted">
        The page you’re looking for doesn’t exist.
      </p>

      <Link
        to="/discover"
        className="mt-6 inline-block text-primary underline underline-offset-4"
      >
        Back to Discover
      </Link>
    </section>
  );
}