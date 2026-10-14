"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <main id="main-content" className="error-page section-wrap" data-page-ready="error"><h1>A page out<br />of place.</h1><p>The content couldn’t be loaded. Please try again in a moment.</p><button className="btn" onClick={reset}>Try again</button></main>;
}
