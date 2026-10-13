"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <main id="main-content" className="error-page section-wrap"><span className="mono">THE ARCHIVE IS TEMPORARILY UNAVAILABLE</span><h1>A page out<br />of place.</h1><p>The content couldn’t be loaded. Please try again in a moment.</p><button className="text-link" onClick={reset}>Try again ↗</button></main>;
}
