"use client";

export default function TourHelpButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("linkid_tour_done");
        window.location.reload();
      }}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-violet-500"
    >
      Start Tour
    </button>
  );
}
