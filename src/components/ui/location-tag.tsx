"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"

interface LocationTagProps {
  city?: string
  timezone?: string
}

export function LocationTag({ city = "Boston", timezone = "America/New_York" }: LocationTagProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: timezone,
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center gap-2 px-3 py-1 rounded transition-all duration-300"
      style={{
        border: "1px solid var(--site-border)",
        backgroundColor: isHovered ? "rgba(26,45,74,0.4)" : "transparent",
        color: "var(--site-text-muted)",
      }}
    >
      <MapPin size={10} style={{ color: "var(--site-accent)" }} />

      {/* City — slides out on hover */}
      <span
        className="text-[10px] transition-all duration-300 absolute left-8 whitespace-nowrap"
        style={{
          transform: isHovered ? "translateY(-130%)" : "translateY(0)",
          opacity: isHovered ? 0 : 1,
          color: "var(--site-text-muted)",
        }}
      >
        {city}
      </span>

      {/* Time — slides in on hover */}
      <span
        className="text-[10px] transition-all duration-300 absolute left-8 whitespace-nowrap"
        style={{
          transform: isHovered ? "translateY(0)" : "translateY(130%)",
          opacity: isHovered ? 1 : 0,
          color: "var(--site-text)",
        }}
      >
        {currentTime}
      </span>

      {/* Spacer to keep width stable */}
      <span className="text-[10px] invisible">{city.length > 8 ? city : "00:00:00"}</span>
    </button>
  )
}
