import { BrowserSkeleton } from "@/components/shop/Browser";
import s from "./page.module.css";

export default function Loading() {
  return (
    <>
      <header className={s.hero} aria-hidden="true">
        <div className={s.poster}>
          <div className={s.type}>
            <span className={s.skelLine} />
            <span className={s.skelTitle} />
          </div>
          <div className={s.skelPhoto} />
        </div>
      </header>
      <div className={`wrap ${s.body}`}>
        <BrowserSkeleton />
      </div>
    </>
  );
}
