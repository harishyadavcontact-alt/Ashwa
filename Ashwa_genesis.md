# Ashwa_genesis

Status: canonical

## Canonical status
This file is the canonical repo-local doctrine reference for Ashwa and the single source of truth for this repository's product intent.

Use this as the single source of truth for:
- product thesis
- repo structure
- shipping priorities
- agent starting point
- local implementation intent

All other repo notes are downstream and must not override this file.

## Product thesis
Ashwa is a school-transport MVP with parent trust signals, deterministic trip events, live tracking, and dual mobile clients for parents and drivers.

## Shipping intent
- ship a working school-transport system
- increase parent trust through high-signal operational visibility
- keep trip state deterministic and auditable
- make parent and driver workflows operational before expansion

## Repo shape
- `apps/` for mobile clients
- `services/` for backend
- `packages/` for shared logic
- `docs/` for release and pilot operations

## Stack
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Expo React Native
- Socket.IO

## Agent starting point
Start from this file, then inspect:
1. `README.md`
2. `package.json`
3. `docs/`
4. the app or service relevant to the active task

## Shipping loop
1. tighten product intent
2. confirm parent and driver flows
3. ship the smallest trustworthy loop
4. collect operational evidence
5. refine from real field constraints
