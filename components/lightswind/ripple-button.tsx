"use client";

import React from "react";

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  bgColor?: string;
  circleColor?: string;
  width?: string;
  height?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  text = "Click Me",
  bgColor,
  circleColor,
  width,
  height,
  className = "",
  ...props
}) => {
  return (
    <>
      <button
        className={`ripple-btn text-white dark:text-black dark:bg-white bg-black ${className}`}
        style={{
          backgroundColor: bgColor,
          width: width,
          height: height,
        }}
        {...props}
      >
        <span className="circle1"></span>
        <span className="circle2"></span>
        <span className="circle3"></span>
        <span className="circle4"></span>
        <span className="circle5"></span>
        <span className="text">{text}</span>
      </button>

      <style jsx>{`
        .ripple-btn {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: bold;
          padding: 1em 2em;
          border: none;
          border-radius: 0.6rem;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .ripple-btn span:not(:nth-child(6)) {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          height: 30px;
          width: 30px;
          background-color: ${circleColor || "#00FFFC"};
          border-radius: 50%;
          transition: 0.6s ease;
          pointer-events: none;
        }

        .ripple-btn span:nth-child(6) {
          position: relative;
          z-index: 1;
        }

        .ripple-btn span:nth-child(1) {
          transform: translate(-3.3em, -4em);
        }

        .ripple-btn span:nth-child(2) {
          transform: translate(-6em, 1.3em);
        }

        .ripple-btn span:nth-child(3) {
          transform: translate(-0.2em, 1.8em);
        }

        .ripple-btn span:nth-child(4) {
          transform: translate(3.5em, 1.4em);
        }

        .ripple-btn span:nth-child(5) {
          transform: translate(3.5em, -3.8em);
        }

        .ripple-btn:hover span:not(:nth-child(6)) {
          transform: translate(-50%, -50%) scale(4);
          transition: 1.5s ease;
        }
      `}</style>
    </>
  );
};

export default RippleButton;
