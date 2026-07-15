# FloodDrone-BD

An interactive academic AI laboratory for simulated drone delivery of food and medicine to four flood-isolated Bangladesh communities. The project combines resource planning with sequential decision-making and keeps both reinforcement-learning experiments scientifically comparable through one shared environment.

## Features

- Real seeded Particle Swarm Optimization with repaired integer allocations and three baselines
- Shared stochastic drone network, state/action encoder, rewards, weather, and mission termination
- Tabular Value Iteration with convergence and policy inspection
- Tabular epsilon-greedy Q-Learning with learning curves and Q-value inspection
- Controlled 200-episode evaluation under shared weather conditions
- Unified experiment workspace, responsive Tailwind dashboard, Recharts plots, and browser-only JSON/CSV exports
- Vitest coverage for constraints, reproducibility, transitions, convergence, and learning

## Technology

React 19, JavaScript, Vite, React Router, Tailwind CSS v4, Recharts, Lucide React, and Vitest. There is no backend, database, external API, or authentication.

## Run locally

```bash
npm install
npm run dev
npm run test
npm run build
```

## Algorithms

For four villages, PSO searches an 8-dimensional allocation vector: four food quantities followed by four medicine quantities. Candidate positions are rounded, bounded, repaired, and scored using unmet need, critical medicine priority, time, energy, battery risk, capacity, and fairness. Mission counts are derived from weighted load, and battery condition is entered as a 0–100% health value. Battery risk is `energy × (1 − health/100)`, so degraded batteries increase the cost of energy-intensive plans.

Value Iteration uses the environment's complete probability outcomes and Bellman optimality updates. Q-Learning instead samples the same environment and learns state-action values using an epsilon-greedy policy.

## Documentation

See the colorful [`docs/FLOOD_DRONE_DETAILED_REPORT.doc`](docs/FLOOD_DRONE_DETAILED_REPORT.doc) for the complete PSO, Value Iteration, Q-Learning, shared mission workflow, equations, examples, graphs, and comparison methodology.

## Project structure

```text
src/
  algorithms/     PSO, Value Iteration, Q-Learning
  simulation/     shared environment, RNG, baselines, evaluator
  data/           villages, resources, network
  components/     layout, charts, controls, network map
  pages/          unified experiments, environment, dashboard, and methodology
  tests/          algorithm and environment tests
  utils/          JSON and CSV exports
```

## Default simulated data

The default localities are Satkania Municipality, Bajalia, Keochia, and Dhemsa. The OpenStreetMap environment can add Rampur, Paschim Amilaish, Charati, and Manik Pathan in Katharia. Locality names and displayed flood-impact notes are sourced; population samples, relief demands, village areas, routes, and resources remain simulated and editable.

## Screenshots

Add dashboard, PSO convergence, network simulation, and comparison screenshots here.

## Limitations and future research

The environment abstracts geography, flight physics, communications, regulations, and real medical logistics. Future work could add verified GIS data, multi-drone scheduling, partial observability, uncertainty calibration, safety constraints, and community-led fairness measures.

## Disclaimer

This is an academic prototype. It combines sourced Chattogram locality context with simulated demand, weather, routes, and probability data. It is not an operational disaster-response system and does not provide medical advice.
