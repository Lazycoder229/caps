"use client"

import { useEffect, useRef } from "react"

type RestaurantRole = "manager" | "crew"

function RestaurantRobot({ role }: { role: RestaurantRole }) {
  const manager = role === "manager"

  return (
    <svg
      className={`restaurant-scroll-mascot restaurant-scroll-mascot--${role}`}
      viewBox="0 0 180 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="90" cy="207" rx="54" ry="9" fill="#5A5143" fillOpacity=".2" />
      <path d="M90 10V24" stroke="#BD8A25" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="9" r="6" fill="#D9AF4A" />
      <rect x="55" y="24" width="70" height="53" rx="19" fill="#F9F5E9" stroke="#C8B98D" strokeWidth="3" />
      <rect x="64" y="37" width="52" height="24" rx="10" fill="#33423B" />
      <circle cx="78" cy="49" r="4" fill="#E8C565" />
      <circle cx="102" cy="49" r="4" fill="#E8C565" />
      <path d="M82 66C87 71 94 71 99 66" stroke="#A77935" strokeWidth="3" strokeLinecap="round" />
      <rect x="84" y="77" width="12" height="13" rx="4" fill="#C8B98D" />
      <path d="M51 102C51 91 61 84 72 84H108C119 84 129 91 129 102V151H51V102Z" fill={manager ? "#D9D2C0" : "#F3EBDD"} stroke="#C8B98D" strokeWidth="3" />
      <rect x="70" y="101" width="40" height="31" rx="8" fill="#3D5145" />
      {manager ? (
        <>
          <path d="M83 101L90 109L97 101L94 127H86L83 101Z" fill="#D4A83F" />
          <rect x="111" y="112" width="29" height="37" rx="4" fill="#F9F5E9" stroke="#A88743" strokeWidth="2" />
          <path d="M117 121H134M117 128H132M117 135H130" stroke="#A88743" strokeWidth="2" strokeLinecap="round" />
          <path d="M51 101L38 128M129 101L141 115" stroke="#D9D2C0" strokeWidth="11" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M78 116H102" stroke="#E8C565" strokeWidth="3" strokeLinecap="round" />
          <path d="M51 101L38 128M129 101L142 128" stroke="#F3EBDD" strokeWidth="11" strokeLinecap="round" />
          <path d="M131 126H170" stroke="#A77935" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="151" cy="121" rx="20" ry="6" fill="#FFFDF7" stroke="#A77935" strokeWidth="2" />
          <path d="M143 119C145 111 151 111 153 119M154 119C156 112 162 112 164 119" stroke="#79A36B" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      <path d="M63 151H117L125 184C127 191 122 196 115 196H65C58 196 53 191 55 184L63 151Z" fill="#D8C9A9" stroke="#B9A77F" strokeWidth="3" />
      <circle cx="75" cy="173" r="6" fill="#58655A" />
      <circle cx="105" cy="173" r="6" fill="#58655A" />
      <circle cx="68" cy="205" r="9" fill="#48534D" stroke="#B9A77F" strokeWidth="3" />
      <circle cx="112" cy="205" r="9" fill="#48534D" stroke="#B9A77F" strokeWidth="3" />
    </svg>
  )
}

export function RestaurantScrollBot() {
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const manager = scene.querySelector<HTMLElement>(".restaurant-bot-card--manager")
    const crew = scene.querySelector<HTMLElement>(".restaurant-bot-card--crew")
    const managerSpeech = scene.querySelector<HTMLElement>(".restaurant-bot-card--manager .restaurant-bot-speech")
    const crewSpeech = scene.querySelector<HTMLElement>(".restaurant-bot-card--crew .restaurant-bot-speech")
    if (!manager || !crew || !managerSpeech || !crewSpeech) return

    const conversations = [
      ["New order is in.", "I’m preparing it now."],
      ["How is the table?", "I’m serving the guests."],
      ["All set for the next guests?", "Table is clean and ready."],
    ]
    let frame = 0
    let isScrollEvent = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const updateBots = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0
        const viewportHeight = window.innerHeight
        const managerY = viewportHeight * (0.23 + progress * 0.27)
        const crewY = viewportHeight * (0.65 + progress * 0.26)
        const phase = Math.min(2, Math.floor(progress * 3))

        manager.style.top = `${managerY}px`
        crew.style.top = `${crewY}px`
        managerSpeech.textContent = conversations[phase][0]
        crewSpeech.textContent = conversations[phase][1]
        if (isScrollEvent) {
          scene.dataset.talking = "true"
          isScrollEvent = false
          if (idleTimer) clearTimeout(idleTimer)
          idleTimer = setTimeout(() => {
            scene.dataset.talking = "false"
          }, 1500)
        }
      })
    }

    const handleScroll = () => {
      isScrollEvent = true
      updateBots()
    }
    updateBots()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", updateBots)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", updateBots)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [])

  return (
    <div ref={sceneRef} className="restaurant-scroll-scene" data-talking="false" aria-hidden="true">
      <svg
        className="restaurant-scene-art"
        viewBox="0 0 720 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="restaurant-wall" x1="360" y1="0" x2="360" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D8D1C3" stopOpacity=".32" />
            <stop offset="1" stopColor="#F7F8F5" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id="restaurant-wood" x1="0" y1="0" x2="720" y2="900" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BBA987" stopOpacity=".28" />
            <stop offset="1" stopColor="#8C806B" stopOpacity=".18" />
          </linearGradient>
        </defs>
        <rect width="720" height="900" fill="url(#restaurant-wall)" />
        <path d="M80 0V260M330 0V230M585 0V250M0 245H720M0 265H720" stroke="#716958" strokeOpacity=".1" />
        <path d="M112 0V72M360 0V62M608 0V82" stroke="#716958" strokeOpacity=".18" />
        <path d="M75 72H149L162 105H62L75 72ZM323 62H397L410 95H310L323 62ZM571 82H645L658 115H558L571 82Z" fill="#B79B69" fillOpacity=".1" />
        <path d="M0 725H720M0 744H720M115 745V900M355 745V900M595 745V900" stroke="#716958" strokeOpacity=".08" />
        <g opacity=".42" stroke="#766A55" strokeOpacity=".24">
          <path d="M20 580H287L316 608H0V602L20 580Z" fill="url(#restaurant-wood)" />
          <path d="M58 608V673M248 608V673M30 674H276" />
          <path d="M414 588C414 568 438 552 468 552C498 552 522 568 522 588V600H414V588Z" fill="url(#restaurant-wood)" />
          <path d="M403 600H533L520 616H416L403 600ZM424 616V682M512 616V682" />
          <path d="M538 645C538 630 558 619 583 619C608 619 628 630 628 645V654H538V645Z" fill="url(#restaurant-wood)" />
          <path d="M530 654H636L625 668H541L530 654ZM550 668V716M615 668V716" />
        </g>
      </svg>
      <span className="restaurant-scroll-track" />
      <div className="restaurant-bot-card restaurant-bot-card--manager">
        <RestaurantRobot role="manager" />
        <span>MANAGER</span>
        <span className="restaurant-bot-speech" />
      </div>
      <div className="restaurant-bot-card restaurant-bot-card--crew">
        <RestaurantRobot role="crew" />
        <span>SERVICE CREW</span>
        <span className="restaurant-bot-speech" />
      </div>
    </div>
  )
}
