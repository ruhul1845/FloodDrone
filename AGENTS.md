# FloodDrone-BD contributor guide

## Architecture

- `src/data` contains editable simulated villages, resources, and network topology.
- `src/simulation/floodDroneEnvironment.js` is the single MDP implementation.
- `src/algorithms` contains PSO, Value Iteration, and Q-Learning implementations.
- `src/simulation/evaluator.js` provides shared controlled policy evaluation.
- `src/pages` and `src/components` contain the React/Tailwind interface.

## Algorithm rules

PSO operates continuously but every candidate must be discretized and repaired before fitness evaluation. Runs must remain reproducible with the seeded RNG. Value Iteration and Q-Learning must both use `FloodDroneEnvironment`; never duplicate transition, weather, terminal, or reward logic inside an algorithm. Value Iteration calls `getTransitionOutcomes()`. Q-Learning interacts through `reset()` and `step()`.

## Verification

```bash
npm run test
npm run build
```
