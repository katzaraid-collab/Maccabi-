import { BrowserSkeleton } from "@/components/shop/Browser";
import s from "./page.module.css";

export default function Loading() {
  return (
    <>
      <header className={s.hero} aria-hidden="true">
        <div className="wrap">
          <p className={s.tech}>
            <span className="latin">SEARCH</span>
          </p>
        </div>
      </header>
      <div className={`wrap ${s.body}`}>
        <BrowserSkeleton />
      </div>
    </>
  );
}
