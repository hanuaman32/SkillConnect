import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-brand-600 hover:underline">
        Back to home
      </Link>
    </section>
  );
}
