export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Connect Strava</h1>
      <a
        href="http://localhost:4000/auth/strava/start"
        className="mt-4 inline-block rounded-lg border px-4 py-2"
      >
        Connect with Strava
      </a>
    </main>
  );
}
