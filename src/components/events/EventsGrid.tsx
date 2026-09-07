"use client";

import React, { useState } from "react";
import { EventCard } from "./EventCard";
import { EventModal } from "./EventModal";
import { eventsData, EventData } from "@/data/events";

export const EventsGrid: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {eventsData.map((event, index) => {
          // Define Bento Grid variations based on index
          let colSpanClass = "col-span-1";
          let layoutType: "horizontal" | "vertical" = "vertical";

          // If only 1 event exists, center it nicely across columns as a featured card
          if (eventsData.length === 1) {
            colSpanClass = "col-span-1 md:col-span-2 lg:col-span-3 max-w-4xl mx-auto w-full";
            layoutType = "horizontal";
          } else if (index === 0 || index === 3) {
            // Bento layout when multiple events exist
            colSpanClass = "md:col-span-2 lg:col-span-2";
            layoutType = "horizontal";
          }

          return (
            <div key={event.id} className={`${colSpanClass} h-full`}>
              <EventCard
                event={event}
                layout={layoutType}
                onClick={() => setSelectedEvent(event)}
              />
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
