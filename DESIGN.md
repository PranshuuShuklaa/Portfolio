---
name: Pranshu Shukla Portfolio
description: An editorial work index with moving ink and cursor-led assembly.
colors:
  paper: "#f3f1e9"
  paper-dark: "#e7e5da"
  ink: "#25241f"
  muted: "#514d42"
  rule: "#a9a595"
  pine: "#203b31"
  pine-deep: "#192e26"
  wine: "#603742"
  white: "#faf6e8"
  green-light: "#c5d4be"
  cursor: "#64434a"
  cursor-alt: "#355d47"
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
    backgroundColor: "{colors.pine}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
  terminal:
    backgroundColor: "{colors.pine-deep}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
  work-index:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.white}"
---

# Design System

## Overview

A large serif name and a portfolio terminal share the opening. A single pointer-reactive orbital drawing gives the introduction movement. Selected Work has a short scroll-controlled chapter transition before the three projects.

## Colors

Paper is the main surface. Forest green anchors the terminal, work opener, and contact. Burgundy marks links, cursor motion, and the work opener’s flat color wipe.

## Typography

Baskervville is used for the name and headlines. Switzer carries copy and navigation. Monospace is confined to the terminal prompt and command input.

## Layout

A shared 88rem frame aligns the hero, projects, and profile. Each project uses one wide visual beside its description. On small screens, project titles and links appear before their media. The work opener has a short sticky range for the zoom and wipe. The reduced-motion layout uses the work opener in ordinary flow.

## Components

The terminal supports project and section commands, help, and keyboard history. Every project uses one screenshot or video. Cursor scenes rearm when their section has left the viewport, then play on re-entry from either direction. Offscreen orbital drawing pauses. The contact list shows Instagram once as a simple text link.
