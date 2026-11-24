---
name: Pranshu Shukla Portfolio
description: An editorial work index with signal traces and cursor-led assembly.
colors:
  paper: "#f0ece3"
  paper-dark: "#e5ddd0"
  ink: "#231f1b"
  muted: "#554940"
  rule: "#b8aa98"
  graphite: "#322b25"
  graphite-deep: "#24211e"
  accent: "#963d2b"
  cream: "#fff3de"
  quiet: "#ded0bd"
  cursor: "#963d2b"
  cursor-alt: "#322b25"
typography:
  display:
    fontFamily: "Baskervville, Georgia, serif"
    fontSize: "clamp(4.8rem, 3.7rem + 5.5vw, 9.4rem)"
    fontWeight: 470
    lineHeight: 0.84
    letterSpacing: "-.04em"
  section:
    fontFamily: "Baskervville, Georgia, serif"
    fontSize: "clamp(2.65rem, 1.6rem + 3.35vw, 5rem)"
    fontWeight: 470
    lineHeight: 0.98
  project:
    fontFamily: "Baskervville, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.35rem + 2.65vw, 4.1rem)"
    fontWeight: 480
  body:
    fontFamily: 'Switzer, "Segoe UI", sans-serif'
    fontSize: "clamp(1rem, .94rem + .22vw, 1.15rem)"
    lineHeight: 1.54
  terminal:
    fontFamily: '"Cascadia Mono", Consolas, monospace'
    fontSize: ".95rem"
rounded:
  square: "0px"
spacing:
  gutter: "clamp(1.2rem, 5vw, 5.6rem)"
  section: "clamp(2.1rem, 4.7vw, 4.75rem)"
components:
  action:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.cream}"
    rounded: "{rounded.square}"
  terminal:
    backgroundColor: "{colors.graphite-deep}"
    textColor: "{colors.cream}"
    rounded: "{rounded.square}"
  work-index:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.cream}"
---

# Design System

## Overview

A large serif name and a portfolio terminal share the opening. Signals travel along a circuit drawing that reacts to the pointer. Selected Work has a short scroll-controlled chapter transition before the three projects.

## Colors

Warm paper is the main surface. Graphite anchors the terminal, work opener, and contact. Brick red marks actions, circuit signals, and the work opener’s flat color wipe.

## Typography

Baskervville is used for the name and headlines. Switzer carries copy and navigation. Monospace is confined to the terminal prompt and command input.

## Layout

A shared 88rem frame aligns the hero, projects, and profile. Each project uses one wide visual beside its description. On small screens, project titles and links appear before their media. The work opener has a short sticky range for the zoom and wipe. The reduced-motion layout uses the work opener in ordinary flow.

## Components

The terminal supports project and section commands, help, and keyboard history. Every project uses one screenshot or video. Larger cursor arrows draw the text and pull open the media frame, then replay on viewport re-entry from either direction. A reticle acts as the mouse cursor and becomes a diamond over actions. The circuit drawing pauses offscreen. Terminal responses, expanded entries, and project images have supporting motion.

Bit uses the existing colors and travels in a small right margin. Bit sits on a broom while scrolling, jumps off after scrolling pauses, then settles with a short gesture. After a reading pause, Bit brews coffee and offers it once. The pet button opens project shortcuts and lets visitors brew another coffee, send a spark through nearby circuits, or put Bit to sleep. The terminal command `pet` toggles sleep. Reduced motion keeps Bit docked with the same controls.

The circuit drawing continues through the project, profile, activity, and contact backgrounds. Short ripple rings mark the line junctions. Signals pause offscreen, and a spark from Bit sends brighter signals along neighboring traces.
