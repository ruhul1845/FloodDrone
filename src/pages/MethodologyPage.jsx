import PageIntro from '../components/common/PageIntro'
import Notice from '../components/common/Notice'

const sections = [
  {
    title:'1. PSO particle representation',
    fn:'runPSO(options)',
    formula:`X = [F₁, F₂, …, Fₙ, M₁, M₂, …, Mₙ]
dimension(X) = 2N

For N = 4:
X = [F₁,F₂,F₃,F₄,M₁,M₂,M₃,M₄]`,
  },
  {
    title:'2. Weighted load and missions',
    fn:'calculateLoad(food, medicine)',
    formula:`Loadᵢ = 0.9Fᵢ + 0.1Mᵢ
Missionsᵢ = ⌈Loadᵢ / MaxPayload⌉

Default MaxPayload = 10`,
  },
  {
    title:'3. Allocation repair and constraints',
    fn:'repairAllocation(position, villages, resources)',
    formula:`Fᵢ ← max(0, round(Fᵢ))
Mᵢ ← max(0, round(Mᵢ))

0 ≤ Fᵢ ≤ FoodDemandᵢ
0 ≤ Mᵢ ≤ MedicineDemandᵢ
ΣFᵢ ≤ AvailableFood
ΣMᵢ ≤ AvailableMedicine`,
  },
  {
    title:'4. Demand shortage',
    fn:'evaluateAllocation(vector, villages, resources)',
    formula:`UnmetFoodᵢ = max(0, FoodDemandᵢ − Fᵢ)
UnmetMedicineᵢ = max(0, MedicineDemandᵢ − Mᵢ)

Fᵤ = Σ UnmetFoodᵢ
Cₘ = Σ CriticalUnmetMedicineᵢ
Nₘ = Σ NonCriticalUnmetMedicineᵢ`,
  },
  {
    title:'5. Satisfaction and fairness',
    fn:'evaluateAllocation(vector, villages, resources)',
    formula:`FoodCoverageᵢ = min(1, Fᵢ / FoodDemandᵢ)
MedicineCoverageᵢ = min(1, Mᵢ / MedicineDemandᵢ)

Sᵢ = 0.6(FoodCoverageᵢ) + 0.4(MedicineCoverageᵢ)
G = max(Sᵢ) − min(Sᵢ)
FairnessScore = (1 − G) × 100`,
  },
  {
    title:'6. Delivery time, energy, and battery risk',
    fn:'evaluateAllocation(vector, villages, resources)',
    formula:`T = Σ(Missionsᵢ × Distanceᵢ × 2 / 35)
E = Σ(Missionsᵢ × Distanceᵢ × 0.18)
B = E × (1 − H/100)

H = selected battery health percentage`,
  },
  {
    title:'7. PSO cost and fitness',
    fn:'evaluateAllocation(vector, villages, resources)',
    formula:`Cost = 100Cₘ + 40Nₘ + 10Fᵤ + 5T
     + 3E + 20B + 100V + 30G

Fitness = −Cost
Best solution = arg max(Fitness)`,
  },
  {
    title:'8. PSO velocity and position update',
    fn:'runPSO(options)',
    formula:`vᵢₑ(t+1) = wvᵢₑ(t)
          + c₁r₁(pbestᵢₑ − xᵢₑ(t))
          + c₂r₂(gbestₑ − xᵢₑ(t))

xᵢₑ(t+1) = clamp(xᵢₑ(t) + vᵢₑ(t+1), 0, maxₑ)

w=0.7, c₁=1.5, c₂=1.5`,
  },
  {
    title:'9. MDP state and action functions',
    fn:'FloodDroneEnvironment',
    formula:`s = (location, battery, payload, target, weather)

A(s) = valid NeighborMoves(s)
     ∪ {DELIVER, RECHARGE, WAIT}

Payload ∈ {FOOD, MEDICINE, BOTH}
Weather ∈ {SAFE, WINDY, SEVERE}
Battery ∈ {0, 1, …, maxBattery}

State key:
location|battery|payload|target|weather`,
  },
  {
    title:'10. Movement transition probabilities',
    fn:'getTransitionOutcomes(state, action)',
    formula:`SAFE:
  move success = 0.95
  stay         = 0.05
  emergency    = 0.00

WINDY:
  move success = 0.75
  stay         = 0.20
  emergency    = 0.05

SEVERE:
  move success = 0.40
  stay         = 0.40
  emergency    = 0.20

Every GO action decreases battery by 1.
If new battery = 0 → terminal battery failure.`,
  },
  {
    title:'11. Weather transition probabilities',
    fn:'#weatherOutcomes(original, next, action, probability)',
    formula:`Current SAFE → SAFE 0.70, WINDY 0.25, SEVERE 0.05
Current WINDY → SAFE 0.30, WINDY 0.50, SEVERE 0.20
Current SEVERE → SAFE 0.10, WINDY 0.35, SEVERE 0.55

Combined transition:
P(s′|s,a) = MovementProbability × WeatherProbability`,
  },
  {
    title:'12. Complete reward function',
    fn:'getReward(state, action, nextState, event)',
    formula:`FAILURES
R = −20   invalid action / invalid recharge
R = −120  battery failure
R = −180  episode timeout

MOVEMENT
R = −2    GO action in SAFE weather
R = −10   GO action in WINDY weather  (−2 − 8)
R = −27   GO action in SEVERE weather (−2 − 25)

WAIT
R = −4    WAIT in SAFE weather
R = +10   WAIT in WINDY or SEVERE weather

RECHARGE
R = +25   at C/C2 when battery ≤ 1
R = +2    at C/C2 when battery > 1
R = −20   RECHARGE anywhere else

DELIVERY
R = −30   DELIVER at wrong village
R = +40   FOOD delivery (all urgency levels)
R = +150  MEDICINE to Critical village
R = +100  MEDICINE to High village
R = +80   MEDICINE to other urgency
R = +170  BOTH to Critical village (120 + 50)
R = +145  BOTH to High village     (120 + 25)
R = +130  BOTH to other urgency    (120 + 10)`,
  },
  {
    title:'13. Value Iteration inputs and state space',
    fn:'runValueIteration(environment, options)',
    formula:`Default parameters:
γ = 0.9
θ = 0.001
maxIterations = 1000

Full default state count:
9 locations × 4 battery values × 3 payloads
× 16 targets × 3 weather values
= 5,184 states

Only A1 target representatives are solved first.
Their values/policies are copied to sibling A2–A4 areas.`,
  },
  {
    title:'14. Value Iteration Bellman update',
    fn:'runValueIteration(environment, options)',
    formula:`ActionValue(s,a) = Σₛ′ P(s′|s,a)
                    × [R(s,a,s′) + γV(s′)]

Vnew(s) = maxₐ ActionValue(s,a)
π(s) = arg maxₐ ActionValue(s,a)

δ = maxₛ |Vnew(s) − V(s)|
Stop when δ < θ

Battery-zero state value = −120
Terminal next state has no discounted future value.`,
  },
  {
    title:'15. Value Iteration numerical example',
    fn:'getTransitionOutcomes() + Bellman update',
    formula:`Assume action GO_J1 has two outcomes:

Outcome 1:
P = 0.95, R = −2, V(s′) = 40

Outcome 2:
P = 0.05, R = −2, V(s′) = 20

γ = 0.9

ActionValue = 0.95[−2 + 0.9(40)]
            + 0.05[−2 + 0.9(20)]
            = 0.95(34) + 0.05(16)
            = 33.10

VI calculates this for every valid action.
The action with maximum value becomes π(s).`,
  },
  {
    title:'16. Q-Learning inputs and Q-table key',
    fn:'qKey() + bestQAction()',
    formula:`Default parameters:
episodes = 5000
α = 0.3
γ = 0.9
ε₀ = 0.3
εmin = 0.02
εdecay = 0.999
maxSteps = 30
seed = 42

Q-table key:
stateKey::action

Example:
H|3|BOTH|V1-A1|WINDY::GO_J1

bestQAction = valid action with maximum stored Q-value.
Missing Q-values are treated as 0.`,
  },
  {
    title:'17. Q-Learning update equation',
    fn:'runQLearning(environment, options)',
    formula:`TD Target = r + γ maxₐ′ Q(s′,a′)
TD Error = TD Target − Q(s,a)

Qnew(s,a) = Qold(s,a) + α[TD Error]

If next state is terminal:
max Q(s′,a′) = 0

Implementation also uses:
maxNext = max(0, all next-action Q-values)`,
  },
  {
    title:'18. Q-Learning numerical example',
    fn:'Q-value update inside runQLearning()',
    formula:`Given:
Qold(s,a) = 10
r = 20
max Q(s′,a′) = 15
α = 0.3
γ = 0.9

TD Target = 20 + 0.9(15) = 33.5
TD Error = 33.5 − 10 = 23.5

Qnew = 10 + 0.3(23.5)
     = 17.05`,
  },
  {
    title:'19. Epsilon-greedy exploration',
    fn:'runQLearning(environment, options)',
    formula:`a = random valid action,  if random(0,1) < ε
a = arg maxₐ Q(s,a),       otherwise

εₙₑₓ = max(εₘᵢₙ, ε × decay)

ε₀=0.3, εₘᵢₙ=0.02, decay=0.999

At ε=0.30:
30% random exploration
70% greedy exploitation

After enough episodes, ε reaches 0.02:
2% exploration
98% exploitation`,
  },
  {
    title:'20. Complete Q-Learning episode flow',
    fn:'runQLearning(environment, options)',
    formula:`For each episode:
1. Sample a PSO-derived target and payload.
2. Randomly select initial weather.
3. environment.reset(target, payload, weather).
4. Get valid actions.
5. Select random/greedy action using ε.
6. environment.step(action).
7. Calculate maxNext and update Q(s,a).
8. Add reward to rewardTotal.
9. Stop on delivery, failure, or maxSteps.
10. Record history and decay ε.

History fields:
episode, reward, steps, success, epsilon,
batteryFailure, severeMoves`,
  },
  {
    title:'21. Q-Learning returned results',
    fn:'runQLearning() return object',
    formula:`qTable               learned state-action values
history              one row per training episode
finalEpsilon         exploration after training
episodes             completed training episodes
runtime              training time in milliseconds
successRate          training delivery success %
averageReward        mean training episode reward
averageSteps         mean steps per episode
batteryFailureRate   training battery failure %
criticalSuccessRate  Critical medicine/BOTH success %
parameters           exact parameters used`,
  },
  {
    title:'22. Controlled policy evaluation',
    fn:'evaluatePolicy(environment, policyFn, options)',
    formula:`AverageReward = (Σ EpisodeRewardₖ) / Episodes
SuccessRate = 100(Σ Successₖ / Episodes)
BatteryFailureRate = 100(Σ Failureₖ / Episodes)
AverageSteps = (Σ Stepsₖ) / Episodes
CriticalSuccessRate = 100(Critical successes / Critical missions)
FoodSuccessRate = 100(Food successes / Food missions)

Recorded per episode:
totalReward, success, criticalSuccess, foodSuccess,
steps, finalBattery, batteryFailure,
invalidActions, severeMoves

Default evaluation episodes = 200
Default evaluation seed = 99`,
  },
  {
    title:'23. Comparison function',
    fn:'runBoth()',
    formula:`For each shared γ:
  VIReward(γ) = Evaluate(VI policy trained with γ)
  QLReward(γ) = Evaluate(QL policy trained with γ)

Same villages
Same PSO-derived mission plan
Same weather transitions
Same evaluation seed and missions

Main comparison metrics:
averageReward, successRate, criticalSuccessRate,
foodSuccessRate, averageSteps, batteryFailureRate,
invalidActions, severeMoves

Gamma sweep values:
0.1, 0.3, 0.5, 0.7, 0.9, 0.95
+ custom VI and QL gamma values`,
  },
]

export default function MethodologyPage() {
  return <div>
    <PageIntro kicker="Academic documentation" title="Functions, Equations & Methodology" description="The exact mathematical functions and update rules implemented by PSO, the drone MDP, Value Iteration, Q-Learning, evaluation, and comparison."/>
    <Notice>All variables, rewards, demands, routes, and probabilities are simulated. These functions are for academic experimentation only.</Notice>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {sections.map((section) => <section key={section.title} className="panel-pad overflow-hidden">
        <h2 className="font-bold text-slate-900">{section.title}</h2>
        <div className="mt-3 inline-flex rounded-lg bg-teal-50 px-2.5 py-1 font-mono text-xs font-bold text-teal-700">{section.fn}</div>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">{section.formula}</pre>
      </section>)}
    </div>
    <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-900">Ethical constraint</h2><pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-6 text-rose-800">OperationalDecision = HumanReview(VerifiedData, CommunityInput, QualifiedAuthority){`\n`}AlgorithmOutput ≠ AutomaticEmergencyDecision</pre></section>
  </div>
}
