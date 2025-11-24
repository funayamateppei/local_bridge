export const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20 text-center">
      <div className="space-y-4">
        <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
          No Network? <br /> No Problem.
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          A local-first application that empowers you to create and manage content anywhere,
          anytime. Your data lives on your device and syncs when you're ready.
        </p>
      </div>

      <div className="flex gap-4">
        <button className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition-transform hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95">
          Get Started
        </button>
        <button className="rounded-full border border-surface bg-surface/50 px-8 py-3 font-semibold text-text transition-colors hover:bg-surface hover:text-white">
          Learn More
        </button>
      </div>

      {/* Feature Grid Mockup */}
      <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { title: 'Offline First', desc: 'Works completely without internet.' },
          { title: 'Instant Sync', desc: 'Background synchronization when online.' },
          { title: 'Secure Storage', desc: 'Your data is encrypted locally.' },
        ].map((feature, i) => (
          <div
            key={i}
            className="rounded-2xl border border-surface bg-surface/30 p-6 text-left backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-surface/50"
          >
            <h3 className="mb-2 text-lg font-bold text-text">{feature.title}</h3>
            <p className="text-sm text-muted">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
