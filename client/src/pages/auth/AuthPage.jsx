import { Link, Navigate, useLocation } from "react-router";

import { useAuth } from "../../features/auth/useAuth";
import { Field, Form } from "../../components/ui/Form";
import { Notice } from "../../components/ui/Feedback";

export default function AuthPage({ register = false }) {
  const auth = useAuth();
  const location = useLocation();
  const from = location.state?.from;

  const destination = register
    ? "/onboarding"
    : typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//") &&
        !/^\/(login|register)/.test(from)
      ? from
      : "/discover";

  if (auth.token) {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="stack">
      <div>
        <p className="eyebrow mb-3">
          {register ? "Join the local lineup" : "Back in the game"}
        </p>

        <h1 className="page-title">
          {register ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-3 text-sm text-muted">
          {register
            ? "A new team, a new game, a new reason to get out there."
            : "Your crew and your next match are waiting."}
        </p>
      </div>

      <Notice error>{auth.logoutWarning}</Notice>

      <Form
        key={register ? "register" : "login"}
        submit={register ? "Create account" : "Sign in"}
        action={(values) => {
          if (
            register &&
            new TextEncoder().encode(values.password).length > 72
          ) {
            throw new Error(
              "Use a password of at most 72 UTF-8 bytes.",
            );
          }

          return auth.signIn(register ? "register" : "login", {
            ...(register ? { name: values.name.trim() } : {}),
            email: values.email.trim().toLowerCase(),
            password: values.password,
          });
        }}
      >
        {register && (
          <Field
            label="Full name"
            name="name"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            placeholder="Your name"
          />
        )}

        <Field
          label="Email address"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
        />

        <Field
          label="Password"
          name="password"
          type="password"
          required
          minLength={register ? 10 : 1}
          maxLength={200}
          autoComplete={
            register ? "new-password" : "current-password"
          }
          hint={register ? "At least 10 characters." : undefined}
        />
      </Form>

      <p className="text-sm text-muted">
        {register ? "Already part of the crew?" : "New around here?"}{" "}
        <Link
          to={register ? "/login" : "/register"}
          state={location.state}
          className="font-bold text-primary"
        >
          {register ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}