"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover";
  characters?: string;
}

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  className = "",
  parentClassName = "",
  animateOn = "view",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$&*!@%",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (animateOn === "view" && !hasAnimated) {
      triggerAnimation();
    }
  }, [text]);

  const triggerAnimation = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      iteration += 1 / maxIterations;

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setHasAnimated(true);
      }
    }, speed);
  };

  return (
    <span
      className={`inline-block cursor-default ${parentClassName}`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (animateOn === "hover") triggerAnimation();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}
