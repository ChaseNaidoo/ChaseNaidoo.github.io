import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import CaseStudyPage from "./CaseStudyPage.jsx";
import PixelTransition from "./PixelTransition.jsx";
import "./styles.css";

function getPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function isInternalNav(url) {
  if (url.origin !== window.location.origin) return false;
  const path = normalizePath(url.pathname);
  return path === "/" || path.startsWith("/case-studies");
}

function pathsDiffer(fromPath, toUrl) {
  return normalizePath(fromPath) !== normalizePath(toUrl.pathname);
}

function navDirection(fromPath, toPathname) {
  const to = normalizePath(toPathname);
  const from = normalizePath(fromPath);
  const toStudy = to.startsWith("/case-studies");
  const fromStudy = from.startsWith("/case-studies");
  if (toStudy && !fromStudy) return "forward";
  if (!toStudy && fromStudy) return "back";
  if (toStudy && fromStudy) return "forward";
  return "back";
}

function Root() {
  const [path, setPath] = useState(getPathname);
  const [phase, setPhase] = useState("idle");
  const [direction, setDirection] = useState("forward");
  const pendingRef = useRef(null);
  const lockedRef = useRef(false);
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  const finishToPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) {
      setPhase("reveal");
      return;
    }

    if (pending.mode === "push") {
      window.history.pushState({}, "", pending.href);
    }

    setPath(normalizePath(pending.pathname));
    pendingRef.current = { ...pending, painted: true };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("reveal"));
    });
  }, []);

  const onCovered = useCallback(() => {
    finishToPending();
  }, [finishToPending]);

  const onRevealed = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    lockedRef.current = false;
    setPhase("idle");

    if (pending?.hash) {
      const id = pending.hash.slice(1);
      if (id) {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
          return;
        }
      }
    }

    if (pending && normalizePath(pending.pathname) === "/") {
      window.scrollTo(0, 0);
    }
  }, []);

  const startTransition = useCallback((href, { mode = "push" } = {}) => {
    if (lockedRef.current) return;
    const url = new URL(href, window.location.origin);
    if (!pathsDiffer(pathRef.current, url)) {
      if (url.hash) {
        const el = document.getElementById(url.hash.slice(1));
        el?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    lockedRef.current = true;
    setDirection(navDirection(pathRef.current, url.pathname));
    pendingRef.current = {
      href: `${url.pathname}${url.search}${url.hash}`,
      pathname: url.pathname,
      hash: url.hash,
      mode
    };
    setPhase("cover");
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (lockedRef.current) {
        setPath(getPathname());
        return;
      }
      const next = getPathname();
      if (next === pathRef.current) return;

      lockedRef.current = true;
      setDirection(navDirection(pathRef.current, next));
      pendingRef.current = {
        href: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        pathname: window.location.pathname,
        hash: window.location.hash,
        mode: "replace"
      };
      setPhase("cover");
    };

    const onClick = (event) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("http")) return;
      if (href.startsWith("#")) return;

      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (!isInternalNav(url)) return;
      if (!pathsDiffer(pathRef.current, url)) return;

      event.preventDefault();
      startTransition(`${url.pathname}${url.search}${url.hash}`, { mode: "push" });
    };

    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, [startTransition]);

  const caseStudyMatch = path.match(/^\/case-studies\/([^/]+)$/);
  const page = caseStudyMatch ? (
    <CaseStudyPage slug={caseStudyMatch[1]} />
  ) : path !== "/" ? (
    <CaseStudyPage slug="" />
  ) : (
    <App />
  );

  return (
    <>
      {page}
      <PixelTransition
        phase={phase}
        direction={direction}
        onCovered={onCovered}
        onRevealed={onRevealed}
      />
    </>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
