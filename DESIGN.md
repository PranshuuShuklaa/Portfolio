---
name: Pranshu Shukla Portfolio
description: A terminal-inspired portfolio built by cursor arrows.
colors:
  page: "#18191b"
  surface: "#202123"
  ink: "#f0eee8"
  muted: "#b8b7b0"
  rule: "#454649"
  paper: "#e5e4e1"
  paper-ink: "#202123"
  paper-muted: "#4f504c"
  signal: "#aebaff"
  signal-strong: "#354bc5"
  cursor: "#9aabff"
  cursor-alt: "#f0eee8"
  cursor-alt-paper: "#232835"
typography:
  display:
    fontFamily: 'Switzer, "Segoe UI", sans-serif'
    fontSize: "clamp(4.2rem, 2rem + 6.6vw, 7.75rem)"
    fontWeight: 655
    lineHeight: 0.88
    letterSpacing: "-.04em"
  display-mobile:
    fontSize: "clamp(3.7rem, 16vw, 5.4rem)"
  section-heading:
    fontSize: "clamp(2.25rem, 1.65rem + 2.05vw, 3.8rem)"
    fontWeight: 630
  featured-project:
    fontSize: "clamp(2.1rem, 1.5rem + 2.15vw, 3.75rem)"
    fontWeight: 630
  project-title:
    fontSize: "clamp(1.65rem, 1.27rem + .9vw, 2.4rem)"
    fontWeight: 630
  profile-heading:
    fontSize: "clamp(1.9rem, 1.51rem + 1.1vw, 2.75rem)"
  tagline:
    fontSize: "clamp(1.33rem, 1.07rem + .8vw, 1.95rem)"
  about-lead:
    fontSize: "clamp(1.25rem, 1rem + .65vw, 1.65rem)"
  body:
    fontFamily: 'Switzer, "Segoe UI", sans-serif'
    fontSize: "clamp(1rem, .96rem + .2vw, 1.125rem)"
    lineHeight: 1.55
  console:
    fontFamily: '"Cascadia Mono", "SFMono-Regular", Consolas, monospace'
    fontSize: ".88rem"
    lineHeight: 1.6
  nav:
    fontSize: ".96rem"
rounded:
  square: "0px"
spacing:
  gutter: "clamp(1.25rem, 5.3vw, 5.5rem)"
  console-inset: "clamp(.85rem, 2.15vw, 1.5rem)"
  action-padding: ".55rem .92rem"
components:
  action:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.square}"
    padding: "{spacing.action-padding}"
  terminal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.console}"
    rounded: "{rounded.square}"
  text-link:
    textColor: "{colors.signal}"
---

# Design System

## Overview

Cursor arrows assemble the interface from the header through the contact section. They draw guides through text, place links with a click, and pull open the terminal and project images. The finished site pairs a large two-line name with a usable terminal and leads with Klove Kicks.

## Colors

Charcoal and warm white carry the hero and work. The profile uses a flat paper field with charcoal text. Blue marks cursors, interactive links, and focus.

## Typography

Locally hosted Switzer handles headings and reading text. System monospace is used for commands, the wordmark, motion settings, and dates.

## Layout

A centered 88rem frame carries the two-column hero, a wide Klove Kicks feature, a smaller Infinity feature, and one compact Stipple row. Work, profile, and contact follow the same horizontal alignment. The hero and content grids stack below 41rem. The header gains a second row below 27rem.

## Shapes

Project captures and terminal controls use square corners. Transient cursor outlines describe the opening frame. Click feedback uses a small ring.

## Components

The terminal accepts commands for sections, help, replay, and the motion setting. Site navigation also uses ordinary links. Replay returns to the top and rearms all ten scenes. Anime.js 4.5.0 times three shared cursor moves. The overlays sit inside their sections so their marks stay attached during native scrolling. Reduced motion and unavailable JavaScript present the assembled content.
