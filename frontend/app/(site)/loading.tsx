import { LogoLoader } from "@frontend/components/motion/logo-loader";

export default function Loading() {
  return <main id="main-content" data-page-loading aria-busy="true"><LogoLoader /></main>;
}
