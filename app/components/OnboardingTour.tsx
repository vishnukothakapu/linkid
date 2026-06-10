"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour() {
  useEffect(() => {
    if (localStorage.getItem("linkid_tour_done")) return;

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.6,
      steps: [
        {
          element: "#hero",
          popover: {
            title: "Welcome 👋",
            description: "This is your homepage where users land first.",
          },
        },
        {
          element: "#features",
          popover: {
            title: "Features",
            description: "Explore all capabilities of LinkID.",
          },
        },
        {
          element: "#demo",
          popover: {
            title: "Live Demo",
            description: "See how clean links work in real usage.",
          },
        },
        {
          element: "#how",
          popover: {
            title: "Get Started",
            description: "Create your account and start instantly.",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("linkid_tour_done", "true");
      },
    });

    driverObj.drive();
  }, []);

  return null;
}
