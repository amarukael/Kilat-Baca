"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PublicSession, PublicSlide } from "@/lib/types";

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Phase = "idle" | "playing" | "gap" | "done";

export function useSessionPlayer(session: PublicSession | null) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<PublicSlide | undefined>(undefined);
  const [totalSlides, setTotalSlides] = useState(0);

  const playSlidesRef = useRef<PublicSlide[]>([]);
  const showSlideRef = useRef<(idx: number) => void>(null!);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const showSlide = useCallback((idx: number) => {
    const slides = playSlidesRef.current;
    if (idx >= slides.length) {
      clearTimers();
      setPhase("done");
      setCurrentIndex(0);
      setCurrentSlide(undefined);
      return;
    }

    const slide = slides[idx];
    setCurrentIndex(idx);
    setCurrentSlide(slide);
    setPhase("playing");
    setSecondsLeft(slide.duration);
    clearTimers();

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      const gap = slide.gap;
      if (gap > 0) {
        setPhase("gap");
        setSecondsLeft(gap);
        intervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        timerRef.current = setTimeout(() => {
          clearInterval(intervalRef.current!);
          showSlideRef.current(idx + 1);
        }, gap * 1000);
      } else {
        showSlideRef.current(idx + 1);
      }
    }, slide.duration * 1000);
  }, []);

  const startSession = useCallback(() => {
    if (!session) return;
    const slides = session.shuffleEnabled ? fisherYates(session.slides) : [...session.slides];
    playSlidesRef.current = slides;
    setTotalSlides(slides.length);
    showSlideRef.current(0);
  }, [session]);

  const stopSession = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setCurrentIndex(0);
    setCurrentSlide(undefined);
    setTotalSlides(0);
    playSlidesRef.current = [];
  }, []);

  useEffect(() => {
    showSlideRef.current = showSlide;
  });

  useEffect(() => () => clearTimers(), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return {
    phase,
    currentIndex,
    secondsLeft,
    isFullscreen,
    currentSlide,
    totalSlides,
    startSession,
    stopSession,
    toggleFullscreen,
  };
}
