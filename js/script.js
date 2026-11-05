const root = document.getElementById("root");
const initialScreen = root?.dataset.startScreen || "welcome";

const TRAIN_FILL_COLORS = {
  express: "#005CD5",
  regional: "#B100D5",
  freight: "#00D5C3",
  measure: "#D7D7D7",
  blocked: "#D7D7D7",
};

const SUGGESTION_ASSETS = {
  background: "images/background_suuggestion_mode.png",
};

const SUGGESTION_TOOLTIP_HIDE_MS = 30000;
const SUGGESTION_BRUGG_TOOLTIP_HIDE_MS = 10000;
const SUGGESTION_TOOLTIP_ORDER = [
  "regional-basel",
  "express-frick",
  "regional-lenzburg",
  "freight-baden",
];

const SUGGESTION_LABELS = [
  { text: "Tann", x: 238, y: 501, w: 96 },
  { text: "Auen", x: 778, y: 376 },
  { text: "Berg", x: 1054, y: 390 },
  { text: "Lind", x: 1449, y: 376 },
  { text: "Ried", x: 1288, y: 105, w: 130 },
];

let gameTooltipTimer = null;
let gameRoutePreviewTimer = null;
let gameTrainAnimationFrame = null;
let suggestionPlanSkeletonTimer = null;
let suggestionPlanProgressTimer = null;
const SUGGESTION_PLAN_SKELETON_MS = 2000;
const SUGGESTION_PLAN_EXECUTION_MS = 10000;
const SUGGESTION_PLAN_PROGRESS_TICK_MS = 1000;
const SUGGESTION_TRAIN_STEP_PX = 5;
const SUGGESTION_TRAIN_STEP_MS = 2000;
const SUGGESTION_TRAIN_SPEED_PX_PER_SECOND =
  SUGGESTION_TRAIN_STEP_PX / (SUGGESTION_TRAIN_STEP_MS / 1000);

const suggestionTrains = [
  {
    id: "regional-basel",
    label: "Regionalzug Tann-Auen",
    x: 235,
    y: 668,
    w: 135,
    h: 138,
    rotate: 90,
    className: "regional-west-train",
    fill: TRAIN_FILL_COLORS.regional,
  },
  {
    id: "express-frick",
    label: "Schnellzug Auen-Berg",
    x: 437,
    y: 536,
    w: 139,
    h: 137,
    rotate: 90,
    className: "express-train",
    fill: TRAIN_FILL_COLORS.express,
  },
  {
    id: "regional-lenzburg",
    label: "Regionalzug Ried-Lind",
    x: 1565,
    y: 116,
    w: 135,
    h: 140,
    rotate: 0,
    className: "regional-east-train",
    fill: TRAIN_FILL_COLORS.regional,
  },
  {
    id: "freight-baden",
    label: "G&uuml;terzug Lind",
    x: 1775,
    y: 529,
    w: 135,
    h: 138,
    rotate: 90,
    className: "freight-train",
    fill: TRAIN_FILL_COLORS.freight,
  },
  {
    id: "blocked-brugg",
    label: "Blockierter Zug",
    x: 1024,
    y: 532,
    w: 139,
    h: 137,
    rotate: 90,
    className: "blocked-train",
    fill: TRAIN_FILL_COLORS.blocked,
    disabled: true,
  },
];

const SUGGESTION_TOOLTIP_CONTENT = {
  brugg: {
    title: "St&ouml;rung Bahnhof Berg",
    body:
      "Der Bahnhof&nbsp;<strong>Berg</strong> ist aufgrund einer technischen St&ouml;rung gesperrt. Der graue Zug kann seine Fahrt nicht fortsetzen. Legen Sie f&uuml;r die &uuml;brigen Z&uuml;ge einen geeigneten <strong>Massnahmenplan</strong>&nbsp;fest.",
    x: 1300,
    y: 650,
    w: 348,
    h: 218,
    arrow: "top-left",
    className: "brugg-warning",
    autoHideMs: SUGGESTION_BRUGG_TOOLTIP_HIDE_MS,
  },
  "regional-basel": {
    title: "Regionalzug",
    body:
      "<span>Start: Tann</span><span>Stopp: Matt</span><span>Route: &uuml;ber Auen - Berg - Lind</span><span>Kapazit&auml;t: wenig</span>",
    x: 80,
    y: 548,
    w: 345,
    h: 121,
    arrow: "bottom-left",
  },
  "express-frick": {
    title: "Schnellzug",
    body:
      "<span>Start: Tann</span><span>Stopp: Matt</span><span>Route: &uuml;ber Auen - Berg - Lind</span><span>Kapazit&auml;t: viel</span>",
    x: 438,
    y: 400,
    w: 345,
    h: 121,
    arrow: "bottom-left",
  },
  "regional-lenzburg": {
    title: "Regionalzug",
    body:
      "<span>Start: Tann</span><span>Stopp: Matt</span><span>Route: &uuml;ber Lind - Berg - Auen</span><span>Kapazit&auml;t: wenig</span>",
    x: 1288,
    y: 194,
    w: 345,
    h: 121,
    arrow: "bottom-right",
  },
  "freight-baden": {
    title: "G&uuml;terzug",
    body:
      "<span>Start: Matt</span><span>Stopp: Tann</span><span>Route: &uuml;ber Lind - Berg - Auen</span><span>Kapazit&auml;t: -</span>",
    x: 1506,
    y: 666,
    w: 345,
    h: 121,
    arrow: "top-left",
  },
};

const SUGGESTION_TRAIN_MOTION_PATHS = {
  "regional-basel": [
    { x: 302.5, y: 737 },
    { x: 360, y: 737 },
    ...sampleCubicPoints(
      { x: 360, y: 737 },
      { x: 398, y: 737 },
      { x: 398, y: 604 },
      { x: 506, y: 604 },
    ),
    { x: 690, y: 604 },
    { x: 860, y: 604 },
    { x: 1020, y: 604 },
  ],
  "express-frick": [
    { x: 506.5, y: 604.5 },
    { x: 650, y: 604.5 },
    { x: 825, y: 604.5 },
    { x: 1030, y: 604.5 },
  ],
  "regional-lenzburg": [
    { x: 1632.5, y: 186 },
    { x: 1632.5, y: 300 },
    { x: 1632.5, y: 455 },
    { x: 1632.5, y: 598 },
    { x: 1500, y: 598 },
    { x: 1320, y: 598 },
    { x: 1120, y: 598 },
  ],
  "freight-baden": [
    { x: 1842.5, y: 598 },
    { x: 1700, y: 598 },
    { x: 1562, y: 598 },
    { x: 1450, y: 598 },
    { x: 1300, y: 598 },
    { x: 1120, y: 598 },
  ],
};

const SUGGESTION_TRAIN_MOTION_METRICS = createMotionMetrics(
  SUGGESTION_TRAIN_MOTION_PATHS,
);

const SUGGESTION_ROUTES = {
  "regional-basel": {
    path:
      "M380 737 C405 737 390 604.5 506.5 604.5 L780 604.5 L1094 604.5 L1494 604.5 L1888 604.5",
    highlight: { x: 225, y: 658, w: 155, h: 158 },
    dots: [
      { x: 820, y: 604.5 },
      { x: 1094, y: 604.5 },
      { x: 1494, y: 604.5 },
    ],
  },
  "express-frick": {
    path: "M586 604.5 L1888 604.5",
    highlight: { x: 427, y: 526, w: 159, h: 157 },
  },
  "regional-lenzburg": {
    path:
      "M1632.5 266 L1632.5 604.5 L1494 604.5 L1094 604.5 L820 604.5 L506.5 604.5 C390 604.5 405 737 360 737 L302.5 737",
    highlight: { x: 1555, y: 106, w: 155, h: 160 },
    dots: [
      { x: 1494, y: 604.5 },
      { x: 1094, y: 604.5 },
      { x: 820, y: 604.5 },
    ],
    flag: { x: 265, y: 600 },
  },
  "freight-baden": {
    path:
      "M1765 604.5 L1494 604.5 L1094 604.5 L820 604.5 L506.5 604.5 C390 604.5 405 737 360 737 L302.5 737",
    highlight: { x: 1765, y: 519, w: 155, h: 158 },
    flag: { x: 265, y: 600 },
  },
};

const SUGGESTION_AI_PLAN_ITEMS = [
  {
    id: "express-reroute",
    nodeId: "118:5768",
    title: "Schnellzug umleiten",
    body: "Der Schnellzug &uuml;ber Ried umleiten",
    executionText: "Der Schnellzug wird &uuml;ber Ried umgeleitet",
  },
  {
    id: "regional-turnback",
    nodeId: "118:5949",
    title: "Regionalzug wenden",
    body: "Beide Regionalzug wenden kurz vor der St&ouml;rung",
    executionText: "Beide Regionalzug wenden kurz vor der St&ouml;rung",
  },
  {
    id: "freight-cancel",
    nodeId: "118:5978",
    title: "G&uuml;terzug ausfallen lassen",
    body: "Der G&uuml;terzug wird gestoppt und f&auml;llt aus",
    executionText: "Der G&uuml;terzug wird gestoppt und f&auml;llt aus",
  },
];

const conceptCards = [
  {
    title: "Szenario",
    body: "Ein Bahnhof f&auml;llt aufgrund einer St&ouml;rung aus. Dadurch k&ouml;nnen mehrere Z&uuml;ge ihre geplante Strecke nicht wie vorgesehen befahren.",
    imageSrc: "images/instruction_scenario.png",
    nodeId: "56:2266",
  },
  {
    title: "Aufgabe",
    body: "Ihre Aufgabe besteht darin, einen Massnahmenplan zu erstellen. Ein Massnahmenplan legt fest, wie auf die St&ouml;rung reagiert werden soll, z. B. indem Z&uuml;ge umgeleitet, gewendet oder ausfallen gelassen werden.",
    imageSrc: "images/instruction_task.png",
    nodeId: "56:2279",
  },
  {
    title: "Ziel",
    bodyHtml: `
      <p>Versuchen Sie, die Auswirkungen der St&ouml;rung m&ouml;glichst gering zu halten.</p>
      <p>Achten Sie dabei insbesondere darauf, dass:</p>
      <ul>
        <li>m&ouml;glichst viele Reisende ihr Ziel erreichen,</li>
        <li>Versp&auml;tungen begrenzt werden,</li>
        <li>wichtige Verbindungen erhalten bleiben.</li>
      </ul>
    `,
    imageSrc: "images/instruction_goal.png",
    nodeId: "56:2286",
  },
];

const trainCards = [
  {
    title: "Schnellzug / IC",
    bodyHtml: `
      <ul>
        <li>Verbindet gr&ouml;ssere St&auml;dte.</li>
        <li>H&auml;lt nur an wenigen Bahnh&ouml;fen.</li>
        <li>Bef&ouml;rdert viele Reisende.</li>
      </ul>
    `,
    visual: "train-fast",
    nodeId: "56:2297",
  },
  {
    title: "Regionalzug / S-Bahn",
    bodyHtml: `
      <ul>
        <li>H&auml;lt an vielen Bahnh&ouml;fen.</li>
        <li>Bef&ouml;rdert Reisende auf k&uuml;rzeren Strecken.</li>
        <li>Bef&ouml;rdert weniger Reisende als ein Schnellzug.</li>
      </ul>
    `,
    visual: "train-regional",
    nodeId: "56:2301",
  },
  {
    title: "G&uuml;terzug",
    bodyHtml: `
      <ul>
        <li>Transportiert Waren statt Reisende.</li>
        <li>Ben&ouml;tigt Streckenkapazit&auml;t.</li>
        <li>Hat keinen direkten Einfluss auf die Reisenden.</li>
      </ul>
    `,
    visual: "train-freight",
    nodeId: "56:2305",
  },
];

const measureCards = [
  {
    title: "Wenden",
    body: "Der Zug f&auml;hrt bis m&ouml;glichst nahe an die St&ouml;rung und kehrt dort um. Der Unterbruch wird mit Ersatzb&uuml;ssen geregelt.",
    visual: "measure-turnback",
    nodeId: "57:1257",
  },
  {
    title: "Umleiten",
    body: "Der Zug f&auml;hrt &uuml;ber eine alternative Strecke und kann bei Kapazit&auml;t zus&auml;tzlich anhalten, um betroffene Passagiere aufzunehmen.",
    visual: "measure-reroute",
    nodeId: "57:1261",
  },
  {
    title: "Ausfall",
    body: "Der Zug wird gestrichen und f&auml;hrt nicht mehr weiter.",
    visual: "measure-cancel",
    nodeId: "57:1265",
  },
];

const appState = {
  screen: initialScreen,
  gameDialogVisible: true,
  activeGameTooltip: null,
  gameTooltipIndex: -1,
  gameDisturbanceTooltipNeedsContinue: false,
  gameExplanationLocked: false,
  gameRoutePreviewRunning: false,
  gameTrainMotionStarted: false,
  gameTrainMotionStartedAt: 0,
  gameTrainMotionStoppedAt: null,
  gameTrainMotionStopped: false,
  suggestionAccordionExpanded: false,
  suggestionPlanChoices: createDefaultSuggestionPlanChoices(),
  suggestionOpenPlanChoiceId: null,
  suggestionPlanExecutionState: "idle",
  suggestionPlanExecutionStartedAt: null,
  suggestionAcceptedPlanItems: [],
};

root.addEventListener("click", handleClick);
root.addEventListener("mouseover", handleMouseOver);
root.addEventListener("mouseout", handleMouseOut);
root.addEventListener("mousemove", handleMouseMove);
window.addEventListener("resize", updateGameStageScale);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateGameStageScale);
  window.visualViewport.addEventListener("scroll", updateGameStageScale);
}

render();

function setScreen(screen) {
  if (screen !== "plan-execution") {
    clearSuggestionPlanExecutionTimers();
  }

  appState.screen = screen;
  if (screen === "game") {
    resetSuggestionGameState();
  } else {
    clearGameTooltipTimer();
    clearGameRoutePreviewTimer();
    clearGameTrainAnimationFrame();
  }
  window.scrollTo({ left: 0, top: 0 });
  render();
}

function render() {
  if (appState.screen === "welcome") {
    root.innerHTML = renderWelcomeScreen();
    return;
  }

  if (appState.screen === "concept") {
    root.innerHTML = renderInstructionConceptScreen();
    return;
  }

  if (appState.screen === "trains") {
    root.innerHTML = renderInstructionTrainActionsScreen();
    return;
  }

  if (appState.screen === "game") {
    root.innerHTML = renderSuggestionGameScreen();
    requestAnimationFrame(() => {
      updateGameStageScale();
      syncSuggestionTrainMotion();
    });
    return;
  }

  if (appState.screen === "plan-execution") {
    root.innerHTML = renderSuggestionPlanExecutionScreen();
    return;
  }

  if (appState.screen === "plan-result") {
    root.innerHTML = renderSuggestionPlanResultScreen();
    return;
  }

  if (appState.screen === "plan-end") {
    root.innerHTML = renderSuggestionPlanEndScreen();
  }
}

function handleClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const button = target ? target.closest("[data-action]") : null;
  if (!button) {
    if (appState.suggestionOpenPlanChoiceId && !target?.closest(".suggestion-ai-choice")) {
      appState.suggestionOpenPlanChoiceId = null;
      render();
      return;
    }

    if (target && appState.screen === "game" && !target.closest(".game-accordion")) {
      handleSuggestionCanvasClick(event);
    }
    return;
  }

  const action = button.dataset.action;

  if (action === "go-welcome") setScreen("welcome");
  if (action === "go-concept") setScreen("concept");
  if (action === "go-trains") setScreen("trains");
  if (action === "go-game") setScreen("game");
  if (action === "go-previous-from-game") setScreen("trains");
  if (action === "dismiss-game-dialog") dismissSuggestionDialog();
  if (action === "continue-disturbance-tooltip") continueSuggestionDisturbanceTooltip();
  if (action === "continue-route-tooltip") continueSuggestionRouteTooltip();
  if (action === "pause-game-trains") pauseSuggestionTrains();
  if (action === "toggle-suggestion-accordion") toggleSuggestionAccordion();
  if (action === "start-suggestion-plan-execution") startSuggestionPlanExecution();
  if (action === "cancel-suggestion-plan-execution") cancelSuggestionPlanExecution();
  if (action === "go-suggestion-plan-result") goSuggestionPlanResult();
  if (action === "go-suggestion-plan-end") goSuggestionPlanEnd();
  if (action === "toggle-suggestion-choice") {
    toggleSuggestionPlanChoice(button.dataset.choiceId);
  }
  if (action === "select-suggestion-choice") {
    selectSuggestionPlanChoice(button.dataset.choiceId, button.dataset.choiceValue);
  }
}

function dismissSuggestionDialog() {
  appState.gameDialogVisible = false;
  appState.gameTooltipIndex = -1;
  appState.gameDisturbanceTooltipNeedsContinue = true;
  appState.gameExplanationLocked = true;
  showSuggestionTooltip("brugg", { autoHide: false });
}

function continueSuggestionDisturbanceTooltip() {
  if (appState.activeGameTooltip !== "brugg") return;

  appState.gameDisturbanceTooltipNeedsContinue = false;
  hideSuggestionTooltip({ startRoutePreview: true });
}

function continueSuggestionRouteTooltip() {
  if (!appState.gameRoutePreviewRunning) return;

  showSuggestionRoutePreview(appState.gameTooltipIndex + 1);
}

function toggleSuggestionAccordion() {
  const willExpand = !appState.suggestionAccordionExpanded;
  appState.suggestionAccordionExpanded = willExpand;
  appState.suggestionOpenPlanChoiceId = null;

  if (willExpand) {
    finishSuggestionExplanations();
    stopSuggestionTrainMotion();
  }

  render();
}

function finishSuggestionExplanations() {
  clearGameTooltipTimer();
  stopSuggestionRoutePreviewSequence();
  appState.activeGameTooltip = null;
  appState.gameTooltipIndex = -1;
  appState.gameExplanationLocked = false;
}

function toggleSuggestionPlanChoice(choiceId) {
  if (!choiceId || !appState.suggestionAccordionExpanded) return;

  appState.suggestionOpenPlanChoiceId =
    appState.suggestionOpenPlanChoiceId === choiceId ? null : choiceId;
  render();
}

function selectSuggestionPlanChoice(choiceId, value) {
  if (!choiceId || !value) return;

  appState.suggestionPlanChoices = {
    ...appState.suggestionPlanChoices,
    [choiceId]: value,
  };
  appState.suggestionOpenPlanChoiceId = null;
  render();
}

function startSuggestionPlanExecution() {
  finishSuggestionExplanations();
  clearGameTrainAnimationFrame();
  clearSuggestionPlanExecutionTimers();

  appState.suggestionAcceptedPlanItems = getAcceptedSuggestionPlanItems();
  appState.suggestionPlanExecutionState = "skeleton";
  appState.suggestionPlanExecutionStartedAt = null;
  appState.suggestionAccordionExpanded = false;
  appState.suggestionOpenPlanChoiceId = null;
  appState.screen = "plan-execution";
  render();

  suggestionPlanSkeletonTimer = window.setTimeout(() => {
    if (appState.screen !== "plan-execution") return;

    appState.suggestionPlanExecutionState = "running";
    appState.suggestionPlanExecutionStartedAt = Date.now();
    render();
    suggestionPlanProgressTimer = window.setInterval(
      updateSuggestionPlanExecutionProgress,
      SUGGESTION_PLAN_PROGRESS_TICK_MS,
    );
  }, SUGGESTION_PLAN_SKELETON_MS);
}

function updateSuggestionPlanExecutionProgress() {
  if (appState.screen !== "plan-execution") {
    clearSuggestionPlanExecutionTimers();
    return;
  }

  if (!appState.suggestionPlanExecutionStartedAt) return;

  if (Date.now() - appState.suggestionPlanExecutionStartedAt >= SUGGESTION_PLAN_EXECUTION_MS) {
    appState.suggestionPlanExecutionState = "done";
    clearSuggestionPlanExecutionTimers();
  }

  render();
}

function cancelSuggestionPlanExecution() {
  clearSuggestionPlanExecutionTimers();
  appState.screen = "game";
  appState.suggestionPlanExecutionState = "idle";
  appState.suggestionPlanExecutionStartedAt = null;
  appState.suggestionAcceptedPlanItems = [];
  appState.gameDialogVisible = false;
  appState.suggestionAccordionExpanded = true;
  appState.suggestionOpenPlanChoiceId = null;
  stopSuggestionTrainMotion();
  render();
}

function goSuggestionPlanResult() {
  if (appState.suggestionPlanExecutionState !== "done") return;

  clearSuggestionPlanExecutionTimers();
  appState.screen = "plan-result";
  render();
}

function goSuggestionPlanEnd() {
  appState.screen = "plan-end";
  render();
}

function clearSuggestionPlanExecutionTimers() {
  if (suggestionPlanSkeletonTimer) {
    window.clearTimeout(suggestionPlanSkeletonTimer);
    suggestionPlanSkeletonTimer = null;
  }

  if (suggestionPlanProgressTimer) {
    window.clearInterval(suggestionPlanProgressTimer);
    suggestionPlanProgressTimer = null;
  }
}

function getAcceptedSuggestionPlanItems() {
  return SUGGESTION_AI_PLAN_ITEMS.filter(
    (item) => appState.suggestionPlanChoices[item.id] === "accept",
  );
}

function getSuggestionExecutionItems() {
  return appState.suggestionAcceptedPlanItems || [];
}

function getSuggestionPlanExecutionProgress(items) {
  const totalItems = items.length;
  if (totalItems === 0) return 0;
  if (appState.suggestionPlanExecutionState === "done") return totalItems;
  if (
    appState.suggestionPlanExecutionState !== "running" ||
    !appState.suggestionPlanExecutionStartedAt
  ) {
    return 0;
  }

  const elapsed = Math.max(0, Date.now() - appState.suggestionPlanExecutionStartedAt);
  const completed = Math.floor((elapsed / SUGGESTION_PLAN_EXECUTION_MS) * totalItems);

  return Math.min(totalItems, Math.max(1, completed));
}

function handleMouseOver(event) {
  if (appState.screen !== "game" || appState.gameDialogVisible) return;
  if (isSuggestionExplanationLocked()) return;
  if (appState.suggestionAccordionExpanded) return;

  const target = event.target instanceof Element ? event.target : null;
  const alert = target?.closest("[data-alert-tooltip]");
  if (alert && !appState.gameRoutePreviewRunning) {
    showSuggestionTooltip("brugg", { autoHide: false });
    return;
  }

  if (appState.gameRoutePreviewRunning || appState.activeGameTooltip === "brugg") return;

  const train = target?.closest("[data-train-tooltip]");
  if (!train) return;

  const tooltipId = train.dataset.trainTooltip;
  if (!tooltipId || appState.activeGameTooltip === tooltipId) return;

  const index = SUGGESTION_TOOLTIP_ORDER.indexOf(tooltipId);
  appState.gameTooltipIndex = index;
  showSuggestionTooltip(tooltipId, { autoHide: false });
}

function handleMouseOut(event) {
  if (appState.screen !== "game" || appState.gameDialogVisible) return;
  if (isSuggestionExplanationLocked()) return;
  if (appState.suggestionAccordionExpanded) return;

  const target = event.target instanceof Element ? event.target : null;
  const alert = target?.closest("[data-alert-tooltip]");
  if (alert) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && alert.contains(relatedTarget)) return;
    if (appState.activeGameTooltip === "brugg") hideSuggestionTooltip();
    return;
  }

  if (appState.gameRoutePreviewRunning || appState.activeGameTooltip === "brugg") return;

  const train = target?.closest("[data-train-tooltip]");
  if (!train) return;

  const relatedTarget = event.relatedTarget;
  if (relatedTarget instanceof Node && train.contains(relatedTarget)) return;

  if (appState.activeGameTooltip === train.dataset.trainTooltip) {
    hideSuggestionTooltip();
  }
}

function handleMouseMove(event) {
  if (appState.screen !== "game" || appState.gameDialogVisible) return;
  if (
    isSuggestionExplanationLocked() ||
    appState.suggestionAccordionExpanded ||
    appState.gameRoutePreviewRunning
  ) {
    return;
  }
  if (!appState.activeGameTooltip) return;

  const target = event.target instanceof Element ? event.target : null;

  if (appState.activeGameTooltip === "brugg") {
    if (!target?.closest("[data-alert-tooltip]")) hideSuggestionTooltip();
    return;
  }

  const hoveredTrain = target?.closest("[data-train-tooltip]");
  if (hoveredTrain?.dataset.trainTooltip === appState.activeGameTooltip) return;

  hideSuggestionTooltip();
}

function renderWelcomeScreen() {
  return `
    <main class="welcome-screen" data-name="1 - Willkommen Screen f&uuml;r Experiment" data-node-id="54:862">
      <section class="welcome-copy" aria-labelledby="welcome-title">
        <h1 id="welcome-title" data-node-id="56:2122">Sie befinden sich nun in der Simulation.</h1>
        <div class="welcome-text" data-node-id="56:2123">
          <p>Sie nehmen in der Simulation die Rolle einer Dispatcherin bzw. eines Dispatchers im Bahnverkehr ein. Dispatcher koordinieren den Zugverkehr und entscheiden bei St&ouml;rungen, welche Massnahmen f&uuml;r die betroffenen Z&uuml;ge getroffen werden. Im n&auml;chsten Schritt erhalten Sie eine kurze Einf&uuml;hrung in Ihre Aufgabe, das Szenario und das Ziel der Simulation.</p>
        </div>
      </section>
      <section class="welcome-visual-panel" aria-label="Simulation Vorschau">
        <img alt="" class="welcome-map-image" data-node-id="180:1991" src="images/welcome.png" />
      </section>
      <button class="primary-button welcome-continue" data-action="go-concept" data-node-id="56:2141" type="button">
        Weiter zur Anleitung
      </button>
    </main>
  `;
}

function renderInstructionConceptScreen() {
  return `
    <main class="instruction-screen instruction-concept" data-name="2 - Anleitung Konzept" data-node-id="56:2155">
      ${renderInstructionHeader("go-welcome", "140:1708", "56:2156")}
      ${renderInstructionStepper(1, "56:2256")}
      ${renderGuideCardGrid(conceptCards, "concept-card-grid", "56:2293")}
      ${renderInstructionNextButton("Weiter", "go-trains", "56:2230")}
    </main>
  `;
}

function renderInstructionTrainActionsScreen() {
  return `
    <main class="instruction-screen instruction-trains" data-name="3 - Anleitung Z&uuml;ge und Massnahmen" data-node-id="56:2294">
      ${renderInstructionHeader("go-concept", "140:1710", "56:2295")}
      ${renderInstructionStepper(2, "56:2310")}
      <h2 class="instruction-section-title train-title" data-node-id="57:1276">Die Z&uuml;ge</h2>
      ${renderGuideCardGrid(trainCards, "train-card-grid", "56:2296")}
      <h2 class="instruction-section-title measure-title" data-node-id="57:1277">Die Massnahmen</h2>
      ${renderGuideCardGrid(measureCards, "measure-card-grid", "57:1256")}
      <p class="instruction-training-note" data-node-id="177:2544">Die Zugtypen unterscheiden sich in ihren Eigenschaften. &Uuml;berlegen Sie deshalb, welche Massnahmen f&uuml;r die jeweiligen Z&uuml;ge am besten geeignet sind, um die Auswirkungen der St&ouml;rung m&ouml;glichst gering zu halten.</p>
      ${renderInstructionNextButton("Simulation starten", "go-game", "56:2309")}
    </main>
  `;
}

function renderInstructionHeader(backAction, backNodeId, titleNodeId) {
  return `
    <div class="instruction-header">
      ${renderInstructionBackButton(backAction, backNodeId)}
      ${renderInstructionTitle(titleNodeId)}
    </div>
  `;
}

function renderInstructionBackButton(action, nodeId) {
  return `
    <button class="instruction-back-button" data-action="${action}" data-node-id="${nodeId}" type="button" aria-label="Zur&uuml;ck">
      <span aria-hidden="true">&larr;</span>
    </button>
  `;
}

function renderInstructionTitle(nodeId) {
  return `<h1 class="instruction-title" data-node-id="${nodeId}">Anleitung</h1>`;
}

function renderInstructionStepper(activeStep, nodeId) {
  return `
    <nav aria-label="Anleitungsschritte" class="instruction-stepper" data-node-id="${nodeId}">
      <button class="instruction-stepper-item" data-action="go-concept" ${activeStep === 1 ? 'aria-current="step"' : ""} type="button">
        <span class="${activeStep === 1 ? "stepper-number active" : "stepper-number complete"}">1</span>
        <span class="stepper-label">Aufgabe</span>
      </button>
      <span class="stepper-connector"></span>
      <button class="instruction-stepper-item" data-action="go-trains" ${activeStep === 2 ? 'aria-current="step"' : ""} type="button">
        <span class="${activeStep === 2 ? "stepper-number active" : "stepper-number"}">2</span>
        <span class="${activeStep === 2 ? "stepper-label is-wide" : "stepper-label muted is-wide"}">Zugtypen &amp; Massnahme</span>
      </button>
    </nav>
  `;
}

function renderGuideCardGrid(cards, className, nodeId) {
  return `
    <section class="guide-card-grid ${className}" data-node-id="${nodeId}">
      ${cards.map(renderGuideCard).join("")}
    </section>
  `;
}

function renderGuideCard(card) {
  return `
    <article class="guide-card" data-node-id="${card.nodeId}">
      <figure class="guide-card-visual">${renderGuideVisual(card)}</figure>
      <div class="guide-card-body">
        <h3>${card.title}</h3>
        ${card.bodyHtml || `<p>${card.body}</p>`}
      </div>
    </article>
  `;
}

function renderGuideVisual(card) {
  if (card.imageSrc) {
    return `<img alt="" class="guide-card-image" src="${card.imageSrc}" />`;
  }

  const { visual: type } = card;

  if (type.startsWith("concept")) {
    return `
      <div class="concept-visual ${type}">
        <span class="concept-icon-sun"></span>
        <span class="concept-icon-mountain"></span>
        <span class="concept-icon-ground"></span>
      </div>
    `;
  }

  if (type.startsWith("train")) {
    const colors = {
      "train-fast": TRAIN_FILL_COLORS.express,
      "train-regional": TRAIN_FILL_COLORS.regional,
      "train-freight": TRAIN_FILL_COLORS.freight,
    };

    return renderTrainSvg(`guide-train-icon ${type}`, colors[type]);
  }

  return renderMeasureScene(type);
}

function renderTrainSvg(className, fill = TRAIN_FILL_COLORS.express) {
  return `
    <svg class="${className}" data-name="Zug" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <rect fill="none" width="240" height="240"></rect>
      <path fill="#cdcdcd" d="M151.23,204c4.66,0,8.73-1.27,11-3.12a4.33,4.33,0,0,0,1.85-3.3V74.18c0-11.22-10.53-37.84-43.81-37.83s-43.82,26-43.82,37.83v123.4a3.84,3.84,0,0,0,1.09,2.58c2,2.24,6.49,3.82,11.74,3.84ZM147.55,45.55c.64-.64,6.15,5,6.67,5.7s-.9,2.5-2.44,2.18S146.91,46.19,147.55,45.55Zm-61.28,5.7c.52-.7,6-6.34,6.67-5.7s-2.69,7.56-4.23,7.88S85.66,52.1,86.27,51.25Zm34-9.76c21,0,37.71,11.92,37.71,36.45,0-7.65-14.41-23.16-37.71-23.16S82.53,70.29,82.53,77.94C82.53,53.41,99.28,41.49,120.25,41.49ZM82.58,194.55V92.19c-.86-9.8,9.06-32.53,37.67-32.52s38.52,22.72,37.66,32.52V194.55c0,3-4.92,5.49-11,5.52H93.61C87.5,200,82.56,197.57,82.58,194.55Z"></path>
      <path fill="${fill}" d="M102.32,122.24v77.83h35.36V122.24Z"></path>
      <path fill="${fill}" d="M101.17,200.07V122.24H95.83c-3.55,0-6.42-1.44-6.42-3.21v-2.25c0-1.77,2.87-3.21,6.42-3.21H143.9c3.55,0,6.42,1.44,6.42,3.21V119c0,1.77-2.87,3.21-6.42,3.21h-5.07v77.83h8c6.11,0,11.05-2.5,11-5.52V92.19c.86-9.8-9.06-32.53-37.66-32.52S81.72,82.39,82.58,92.19V194.55c0,3,4.92,5.49,11,5.52Z"></path>
      <path fill="#444444" d="M120.25,54.78c23.3,0,37.71,15.51,37.71,23.16,0-24.53-16.74-36.45-37.71-36.45S82.53,53.41,82.53,77.94C82.53,70.29,96.94,54.78,120.25,54.78Z"></path>
      <path fill="#5b5a5a" d="M143.9,113.57H95.83c-3.55,0-6.42,1.44-6.42,3.21V119c0,1.77,2.87,3.21,6.42,3.21h5.34v77.83h1.15V122.24h35.36v77.83h1.15V122.24h5.07c3.55,0,6.42-1.44,6.42-3.21v-2.25C150.32,115,147.45,113.57,143.9,113.57Z"></path>
      <path fill="#fbfbfb" d="M151.78,53.43c1.54.32,3.05-1.33,2.44-2.18s-6-6.34-6.67-5.7S150.24,53.11,151.78,53.43Z"></path>
      <path fill="#fbfbfb" d="M88.71,53.43c1.54-.32,4.87-7.24,4.23-7.88s-6.15,5-6.67,5.7S87.17,53.75,88.71,53.43Z"></path>
    </svg>
  `;
}

function renderMeasureScene(type) {
  if (type === "measure-turnback") {
    return `
      <div class="measure-scene measure-turnback">
        <img alt="" class="scene-track track-left" src="images/guide-track-horizontal.svg" />
        <img alt="" class="scene-track track-right" src="images/guide-track-horizontal.svg" />
        ${renderTrainSvg("scene-train train-turnback", TRAIN_FILL_COLORS.measure)}
      </div>
    `;
  }

  if (type === "measure-reroute") {
    return `
      <div class="measure-scene measure-reroute">
        <img alt="" class="scene-track crossing" src="images/guide-track-crossing.svg" />
        <img alt="" class="scene-track route-top" src="images/guide-track-horizontal.svg" />
        <img alt="" class="scene-track route-bottom" src="images/guide-track-horizontal.svg" />
        <img alt="" class="scene-track route-curve" src="images/guide-track-curve.svg" />
        ${renderTrainSvg("scene-train train-reroute", TRAIN_FILL_COLORS.measure)}
      </div>
    `;
  }

  return `
    <div class="measure-scene measure-cancel">
      <img alt="" class="scene-track cancel-curve" src="images/guide-track-curve.svg" />
      <img alt="" class="scene-track cancel-deadend" src="images/guide-track-deadend.svg" />
      ${renderTrainSvg("scene-train train-cancel", TRAIN_FILL_COLORS.measure)}
    </div>
  `;
}

function renderInstructionNextButton(label, action, nodeId) {
  return `
    <button class="primary-button instruction-next" data-action="${action}" data-node-id="${nodeId}" type="button">
      ${label}
    </button>
  `;
}

function renderSuggestionGameScreen() {
  return `
    <main class="game-viewport" data-name="5.2 - Suggestion Mode" data-node-id="116:1677">
      <section class="game-stage suggestion-stage" aria-label="Suggestion Mode Bahnnetz">
        <img alt="" class="game-map-base" src="${SUGGESTION_ASSETS.background}" />
        ${renderSuggestionStationLabels()}
        ${renderSuggestionRouteOverlay()}
        ${renderSuggestionDisturbanceHotspot()}
        ${renderSuggestionAlert()}
        ${renderSuggestionTrains()}
        ${renderSuggestionPauseControl()}
        ${renderSuggestionBackButton()}
        ${renderSuggestionAccordion()}
        ${isSuggestionExplanationLocked() ? renderSuggestionExplanationLock() : ""}
        ${appState.gameDialogVisible ? `${renderSuggestionDialogBackdrop()}${renderSuggestionDialog()}` : ""}
        ${renderActiveSuggestionTooltip()}
      </section>
    </main>
  `;
}

function renderSuggestionStationLabels() {
  return SUGGESTION_LABELS.map(
    (label) => {
      const width = label.w ? ` width: ${label.w}px;` : "";
      return `
        <span class="game-station-label suggestion-station-label" style="left: ${label.x}px; top: ${label.y}px;${width}">${label.text}</span>
      `;
    },
  ).join("");
}

function renderSuggestionAlert() {
  return `
    <button class="game-alert-circle" data-alert-tooltip="brugg" aria-label="St&ouml;rung in Berg anzeigen" style="left: 1162px; top: 436px;" type="button">
      <span>!</span>
    </button>
  `;
}

function renderSuggestionDisturbanceHotspot() {
  return `
    <button class="game-disturbance-hotspot suggestion-disturbance-hotspot" data-alert-tooltip="brugg" aria-label="St&ouml;rung Bahnhof Berg anzeigen" type="button"></button>
  `;
}

function renderSuggestionExplanationLock() {
  return `<div class="game-explanation-lock" aria-hidden="true"></div>`;
}

function renderSuggestionTrains() {
  const now = getGameNow();

  return suggestionTrains
    .map((train) => {
      const tooltipAttribute = train.disabled ? "" : `data-train-tooltip="${train.id}"`;
      const disabledClass = train.disabled ? " is-disabled" : "";
      const motion = getSuggestionTrainMotionState(train, now);
      const style = [
        `left: ${formatPixel(motion.left)}`,
        `top: ${formatPixel(motion.top)}`,
        `width: ${train.w}px`,
        `height: ${train.h}px`,
        "--train-nudge-x: 0px",
        "--train-nudge-y: 0px",
        `--train-rotation: ${formatDegree(motion.rotation)}`,
      ].join("; ");

      return `
        <button class="game-train-button ${train.className}${disabledClass}" data-train-id="${train.id}" ${tooltipAttribute} aria-label="${train.label}" style="${style}" type="button">
          ${renderTrainSvg("game-train-image", train.fill)}
        </button>
      `;
    })
    .join("");
}

function renderSuggestionPauseControl() {
  const label = appState.gameTrainMotionStopped ? "Z&uuml;ge pausiert" : "Z&uuml;ge pausieren";

  return `
    <button class="game-pause-button${appState.gameTrainMotionStopped ? " is-paused" : ""}" data-action="pause-game-trains" style="left: 1095px; top: 35px;" type="button" aria-label="${label}">
      <span class="game-pause-icon" aria-hidden="true"><span></span><span></span></span>
      <span class="game-pause-label">${label}</span>
    </button>
  `;
}

function renderSuggestionBackButton() {
  const isDisabled = isSuggestionExplanationLocked();

  return `
    <button class="game-back-button${isDisabled ? " is-disabled" : ""}" data-action="go-previous-from-game" style="left: 78px; top: 63px;" type="button" aria-label="Zur&uuml;ck zur Anleitung" ${isDisabled ? "disabled" : ""}>
      <span aria-hidden="true">&larr;</span>
    </button>
  `;
}

function renderSuggestionAccordion() {
  const isExpanded = appState.suggestionAccordionExpanded;
  const classes = [
    "game-accordion",
    "suggestion-accordion",
    isExpanded ? "is-expanded" : "is-collapsed",
    "is-enabled",
    isSuggestionExplanationLocked() ? "is-disabled" : "",
  ].join(" ");
  const height = isExpanded ? 1006 : 61;
  const isDisabled = isSuggestionExplanationLocked();

  return `
    <aside class="${classes}" data-node-id="${isExpanded ? "118:5802" : "116:3832"}" style="left: 1248px; top: 35px; width: 640px; height: ${height}px;" aria-label="Massnahmenplanung">
      <button class="game-accordion-header" data-action="toggle-suggestion-accordion" type="button" aria-expanded="${isExpanded}" aria-disabled="${isDisabled}" ${isDisabled ? "disabled" : ""}>
        <span class="game-accordion-heading">
          <span class="game-accordion-title">Massnahmeplan KI Vorschlag</span>
          ${
            isExpanded
              ? `<span class="suggestion-accordion-intro">Nachfolgend sehen Sie die Vorschl&auml;ge der KI f&uuml;r die betroffenen Z&uuml;ge. Sie k&ouml;nnen jeden Vorschlag annehmen oder ablehnen.<br><br><strong>Wenn Sie einen Vorschlag ablehnen, wird f&uuml;r den betroffenen Zug keine Massnahme umgesetzt.</strong> Der Zug wartet vor der gesperrten Strecke, bis diese wieder freigegeben wird.</span>`
              : ""
          }
        </span>
        ${renderAccordionChevron()}
      </button>
      ${isExpanded ? renderSuggestionAiPlanList() : ""}
    </aside>
  `;
}

function renderAccordionChevron() {
  return `
    <span class="game-accordion-chevron" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 7.5L10 12.5L15 7.5" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  `;
}

function renderSuggestionAiPlanList() {
  return `
    <div class="suggestion-ai-plan-list" data-node-id="118:5767">
      ${SUGGESTION_AI_PLAN_ITEMS.map(renderSuggestionAiPlanItem).join("")}
    </div>
    <button class="game-accordion-footer-button suggestion-implement-button" data-action="start-suggestion-plan-execution" type="button">Umsetzen</button>
  `;
}

function renderSuggestionAiPlanItem(item) {
  const value = appState.suggestionPlanChoices[item.id] || "reject";
  const isOpen = appState.suggestionOpenPlanChoiceId === item.id;

  return `
    <article class="suggestion-ai-plan-item" data-node-id="${item.nodeId}">
      <h3>${item.title}</h3>
      <div class="suggestion-ai-plan-body">
        <p>${item.body}</p>
        ${renderSuggestionChoiceDropdown(item, value, isOpen)}
      </div>
    </article>
  `;
}

function renderSuggestionChoiceDropdown(item, value, isOpen) {
  const label = getSuggestionPlanChoiceLabel(value);

  return `
    <div class="suggestion-ai-choice${isOpen ? " is-open" : ""}" data-node-id="159:7633">
      <button class="suggestion-ai-choice-control" data-action="toggle-suggestion-choice" data-choice-id="${item.id}" type="button" aria-haspopup="listbox" aria-expanded="${isOpen}" aria-label="Entscheidung f&uuml;r ${item.title}: ${label}">
        <span class="suggestion-ai-choice-value">${label}</span>
        <span class="suggestion-ai-button-chevron" aria-hidden="true"></span>
      </button>
      ${isOpen ? renderSuggestionChoiceOptions(item.id, value) : ""}
    </div>
  `;
}

function renderSuggestionChoiceOptions(choiceId, value) {
  return `
    <div class="suggestion-ai-choice-options" role="listbox" aria-label="Entscheidung ausw&auml;hlen">
      ${renderSuggestionChoiceOption(choiceId, "reject", value)}
      ${renderSuggestionChoiceOption(choiceId, "accept", value)}
    </div>
  `;
}

function renderSuggestionChoiceOption(choiceId, optionValue, selectedValue) {
  const isSelected = optionValue === selectedValue;
  const label = getSuggestionPlanChoiceLabel(optionValue);

  return `
    <button class="suggestion-ai-choice-option${isSelected ? " is-selected" : ""}" data-action="select-suggestion-choice" data-choice-id="${choiceId}" data-choice-value="${optionValue}" type="button" role="option" aria-selected="${isSelected}">
      ${label}
    </button>
  `;
}

function getSuggestionPlanChoiceLabel(value) {
  return value === "accept" ? "Annehmen" : "Ablehnen";
}

function renderSuggestionPlanExecutionScreen() {
  const state = appState.suggestionPlanExecutionState;
  const items = getSuggestionExecutionItems();
  const progress = getSuggestionPlanExecutionProgress(items);
  const isSkeleton = state === "skeleton";
  const isDone = state === "done";
  const nodeId = isSkeleton ? "180:4060" : isDone ? "181:8821" : "181:2075";

  return `
    <main class="suggestion-plan-execution-screen" data-node-id="${nodeId}">
      <section class="suggestion-plan-execution-main">
        <header class="suggestion-plan-execution-header">
          <h1>Massnahmeplan</h1>
          ${isDone ? "" : '<h2>Massnahmeplan wird erstellt<span class="animated-ellipsis" aria-hidden="true"></span><span class="sr-only">...</span></h2>'}
        </header>
        ${
          isSkeleton
            ? renderSuggestionPlanSkeleton()
            : renderSuggestionPlanProgressList(items, progress, isDone)
        }
      </section>
      ${renderSuggestionPlanExecutionActions(isDone)}
    </main>
  `;
}

function renderSuggestionPlanSkeleton() {
  return `
    <section class="suggestion-plan-skeleton" data-node-id="180:4064" aria-hidden="true">
      <span class="suggestion-plan-skeleton-line"></span>
      <span class="suggestion-plan-skeleton-line is-medium"></span>
      <span class="suggestion-plan-skeleton-line"></span>
      <span class="suggestion-plan-skeleton-line is-medium"></span>
      <span class="suggestion-plan-skeleton-line is-short"></span>
      <span class="suggestion-plan-skeleton-line is-medium"></span>
    </section>
  `;
}

function renderSuggestionPlanProgressList(items, progress, isDone) {
  if (items.length === 0) {
    return `
      <section class="suggestion-plan-progress-panel" data-node-id="${isDone ? "181:8825" : "181:2079"}">
        <p class="suggestion-plan-empty">Keine Massnahmen angenommen</p>
      </section>
    `;
  }

  return `
    <section class="suggestion-plan-progress-panel" data-node-id="${isDone ? "181:8825" : "181:2079"}">
      <ul class="suggestion-plan-step-list">
        ${items.map((item, index) => renderSuggestionPlanStep(item, index, progress, isDone)).join("")}
      </ul>
    </section>
  `;
}

function renderSuggestionPlanStep(item, index, progress, isDone) {
  const completed = isDone || index < progress;

  return `
    <li class="suggestion-plan-step" data-suggestion-plan-item="${item.id}" tabindex="0">
      <span class="suggestion-plan-step-text">${item.executionText || item.body}</span>
      ${completed ? '<span class="suggestion-plan-status-check" aria-label="Abgeschlossen"></span>' : '<span class="suggestion-plan-status-spinner" aria-label="Wird geladen"></span>'}
    </li>
  `;
}

function renderSuggestionPlanExecutionActions(isDone) {
  return `
    <footer class="suggestion-plan-actions" data-name="Button Group">
      <button class="plan-button plan-button-neutral" data-action="cancel-suggestion-plan-execution" type="button">Abbrechen</button>
      <button class="plan-button plan-button-primary" ${isDone ? 'data-action="go-suggestion-plan-result"' : "disabled"} type="button">Weiter zum Ergebnis</button>
    </footer>
  `;
}

function renderSuggestionPlanResultScreen() {
  const resultCards = [
    {
      title: "Folgeversp&auml;tung",
      score: "40%",
      percent: 40,
      color: "#f5221f",
      text: "Es sind unn&ouml;tige Folgeversp&auml;tungen entstanden",
    },
    {
      title: "Anschlussverbindung",
      score: "20%",
      percent: 20,
      color: "#f5221f",
      text: "Mehrere Anschlussverbindungen gingen verloren",
    },
    {
      title: "Reisende erreichen ihr Ziel",
      score: "50%",
      percent: 50,
      color: "#f2c029",
      text: "Ein erheblicher Teil der Reisenden erreichte sein Ziel nicht wie geplant.",
    },
  ];

  return `
    <main class="plan-result-screen" data-node-id="suggestion-plan-result" data-name="9 - Feedback">
      <h1>Ergebnis Ihres Massnahmenplans</h1>
      <section class="plan-result-grid" aria-label="Bewertung des Massnahmenplans">
        <article class="plan-result-summary">
          <h2>Gesamtbewertung</h2>
          ${renderResultDonut("36.6 %", 36.6, "#f5221f", "is-large")}
          <p>Die gew&auml;hlten Massnahmen konnten die Auswirkungen der St&ouml;rung nur zu 36.6% begrenzen.</p>
        </article>
        ${resultCards
          .map(
            (card) => `
              <article class="plan-result-card">
                <h2>${card.title}</h2>
                ${renderResultDonut(card.score, card.percent, card.color)}
                <p>${card.text}</p>
              </article>
            `,
          )
          .join("")}
      </section>
      <footer class="plan-result-actions" data-name="Button Group">
        <button class="plan-button plan-button-primary" data-action="go-suggestion-plan-end" type="button">Weiter</button>
      </footer>
    </main>
  `;
}

function renderSuggestionPlanEndScreen() {
  return `
    <main class="plan-end-screen" data-node-id="suggestion-plan-end" data-name="10 - End">
      <h1>Kehren Sie zur Umfrage zur&uuml;ck</h1>
      <section class="plan-end-copy" aria-label="Simulation beendet">
        <p>Vielen Dank, die Simulation ist beendet.</p>
        <p>Kehren Sie bitte zur Umfrage zur&uuml;ck, um die Studie fortzusetzen.</p>
        <p>Sie k&ouml;nnen nun dieses Fenster schliessen.</p>
      </section>
    </main>
  `;
}

function renderResultDonut(score, percent, color, className = "") {
  const progress = Math.max(0, Math.min(100, percent));

  return `
    <div class="result-donut ${className}" style="--result-progress: ${progress}%; --result-color: ${color};" aria-label="${score}">
      <span>${score}</span>
    </div>
  `;
}

function renderSuggestionDialogBackdrop() {
  return `<div class="game-dialog-backdrop" aria-hidden="true"></div>`;
}

function renderSuggestionDialog() {
  return `
    <article class="game-dialog suggestion-dialog" role="dialog" aria-modal="true" aria-labelledby="suggestion-dialog-title" data-action="dismiss-game-dialog" data-node-id="116:3789" style="left: 727px; top: 396px; width: 466px; min-height: 288px;">
      <button class="game-dialog-close" data-action="dismiss-game-dialog" aria-label="Dialog schliessen" type="button">&times;</button>
      <h2 id="suggestion-dialog-title">Ausgangslage</h2>
      <p>Im Bahnnetz ist eine St&ouml;rung aufgetreten. Im n&auml;chsten Schritt sehen Sie die St&ouml;rung sowie die betroffenen Z&uuml;ge. Nehmen Sie sich einen Moment Zeit, um die Situation zu analysieren, bevor Sie einen Massnahmenplan erstellen.</p>
      <button class="primary-button game-dialog-button" data-action="dismiss-game-dialog" type="button">Ok</button>
    </article>
  `;
}

function renderActiveSuggestionTooltip() {
  if (!appState.activeGameTooltip) return "";

  const tooltip = SUGGESTION_TOOLTIP_CONTENT[appState.activeGameTooltip];
  if (!tooltip) return "";
  const now = getGameNow();
  const position = getSuggestionTooltipPosition(appState.activeGameTooltip, now);
  const arrowStyle = getSuggestionTooltipArrowStyle(appState.activeGameTooltip, position, now);
  const continueAction =
    appState.activeGameTooltip === "brugg" && appState.gameDisturbanceTooltipNeedsContinue
      ? "continue-disturbance-tooltip"
      : appState.gameRoutePreviewRunning && SUGGESTION_TOOLTIP_ORDER.includes(appState.activeGameTooltip)
        ? "continue-route-tooltip"
        : "";

  return `
    <article class="game-tooltip ${tooltip.arrow} ${tooltip.className || ""}" data-tooltip-id="${appState.activeGameTooltip}" style="left: ${formatPixel(position.x)}; top: ${formatPixel(position.y)}; width: ${tooltip.w}px; min-height: ${tooltip.h}px; ${arrowStyle}">
      <h2>${tooltip.title}</h2>
      <p>${tooltip.body}</p>
      ${
        continueAction
          ? `<button class="primary-button game-tooltip-continue" data-action="${continueAction}" type="button">Weiter</button>`
          : ""
      }
    </article>
  `;
}

function renderSuggestionRouteOverlay() {
  const route = SUGGESTION_ROUTES[appState.activeGameTooltip];
  if (!route) return "";

  const { path } = route;

  return `
    <svg class="game-route-overlay" data-route-id="${appState.activeGameTooltip}" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs>
        <marker id="suggestion-route-arrow" markerHeight="54" markerUnits="userSpaceOnUse" markerWidth="54" orient="auto" refX="46" refY="27" viewBox="0 0 54 54">
          <path d="M12 10 L44 27 L12 44"></path>
        </marker>
      </defs>
      <path class="game-route-path" d="${path}" marker-end="url(#suggestion-route-arrow)"></path>
      ${renderSuggestionRouteDots(route)}
      ${renderSuggestionRouteFlag(route)}
      ${renderSuggestionRouteHighlight(appState.activeGameTooltip, route)}
    </svg>
  `;
}

function renderSuggestionRouteDots(route) {
  if (!route.dots) return "";

  return route.dots
    .map((dot) => `<circle class="game-route-dot" cx="${dot.x}" cy="${dot.y}" r="21.5"></circle>`)
    .join("");
}

function renderSuggestionRouteFlag(route) {
  if (!route.flag) return "";

  return `
    <g class="suggestion-route-flag" transform="translate(${route.flag.x} ${route.flag.y})">
      <path class="suggestion-route-flag-wave" d="M0 12 C28 -6 49 28 78 12 V61 C49 76 28 43 0 61 Z"></path>
      <path class="suggestion-route-flag-pole" d="M0 8 V92"></path>
    </g>
  `;
}

function renderSuggestionRouteHighlight(routeId, route) {
  const highlight = getSuggestionRouteHighlight(routeId) || route.highlight;
  if (!highlight) return "";

  const { x, y, w, h } = highlight;
  return `<rect class="suggestion-route-highlight" x="${x}" y="${y}" width="${w}" height="${h}"></rect>`;
}

function handleSuggestionCanvasClick(event) {
  if (appState.gameDialogVisible) return;
  if (isSuggestionExplanationLocked()) return;
  if (event.target.closest(".game-tooltip")) return;

  if (appState.activeGameTooltip === "brugg") {
    hideSuggestionTooltip();
    return;
  }

  if (appState.gameRoutePreviewRunning) {
    stopSuggestionRoutePreviewSequence();
    hideSuggestionTooltip();
    return;
  }

  if (appState.activeGameTooltip) {
    hideSuggestionTooltip();
  }
}

function showSuggestionTooltip(tooltipId, options = {}) {
  const { autoHide = true } = options;
  appState.activeGameTooltip = tooltipId;
  render();

  if (autoHide) {
    scheduleGameTooltipHide(tooltipId);
  } else {
    clearGameTooltipTimer();
  }
}

function hideSuggestionTooltip(options = {}) {
  const { startRoutePreview = false } = options;
  const hiddenTooltipId = appState.activeGameTooltip;

  appState.activeGameTooltip = null;
  clearGameTooltipTimer();

  if (startRoutePreview && hiddenTooltipId === "brugg") {
    startSuggestionRoutePreviewSequence();
    return;
  }

  render();
}

function pauseSuggestionTrains() {
  if (appState.gameDialogVisible) return;

  if (appState.gameTrainMotionStopped) {
    resumeSuggestionTrainMotion();
  } else {
    stopSuggestionTrainMotion();
  }

  render();
}

function scheduleGameTooltipHide(tooltipId) {
  clearGameTooltipTimer();
  const autoHideMs =
    SUGGESTION_TOOLTIP_CONTENT[tooltipId]?.autoHideMs || SUGGESTION_TOOLTIP_HIDE_MS;

  gameTooltipTimer = window.setTimeout(() => {
    if (appState.screen !== "game") return;
    if (appState.activeGameTooltip !== tooltipId) return;

    if (tooltipId === "brugg") {
      appState.activeGameTooltip = null;
      appState.gameDisturbanceTooltipNeedsContinue = false;
      render();
      return;
    }

    appState.activeGameTooltip = null;
    render();
  }, autoHideMs);
}

function clearGameTooltipTimer() {
  if (!gameTooltipTimer) return;
  window.clearTimeout(gameTooltipTimer);
  gameTooltipTimer = null;
}

function startSuggestionRoutePreviewSequence() {
  if (appState.screen !== "game" || appState.gameDialogVisible) return;

  clearGameTooltipTimer();
  clearGameRoutePreviewTimer();
  appState.gameExplanationLocked = true;
  appState.gameRoutePreviewRunning = true;
  showSuggestionRoutePreview(0);
}

function showSuggestionRoutePreview(index) {
  if (appState.screen !== "game") {
    stopSuggestionRoutePreviewSequence();
    return;
  }

  if (index >= SUGGESTION_TOOLTIP_ORDER.length) {
    stopSuggestionRoutePreviewSequence();
    appState.activeGameTooltip = null;
    appState.gameTooltipIndex = -1;
    appState.suggestionAccordionExpanded = false;
    startSuggestionTrainMotion();
    render();
    return;
  }

  appState.gameTooltipIndex = index;
  appState.activeGameTooltip = SUGGESTION_TOOLTIP_ORDER[index];
  render();
}

function stopSuggestionRoutePreviewSequence() {
  appState.gameRoutePreviewRunning = false;
  appState.gameExplanationLocked = false;
  clearGameRoutePreviewTimer();
}

function isSuggestionExplanationLocked() {
  return appState.gameExplanationLocked;
}

function clearGameRoutePreviewTimer() {
  if (!gameRoutePreviewTimer) return;
  window.clearTimeout(gameRoutePreviewTimer);
  gameRoutePreviewTimer = null;
}

function startSuggestionTrainMotion() {
  if (
    appState.screen !== "game" ||
    appState.gameTrainMotionStopped ||
    appState.gameTrainMotionStarted
  ) {
    return;
  }

  appState.gameTrainMotionStarted = true;
  appState.gameTrainMotionStartedAt = getGameNow();
  appState.gameTrainMotionStoppedAt = null;
  syncSuggestionTrainMotion(appState.gameTrainMotionStartedAt);
  ensureSuggestionTrainMotionLoop();
}

function resumeSuggestionTrainMotion() {
  if (!appState.gameTrainMotionStopped) return;

  const now = getGameNow();

  if (appState.gameTrainMotionStarted && typeof appState.gameTrainMotionStoppedAt === "number") {
    appState.gameTrainMotionStartedAt += now - appState.gameTrainMotionStoppedAt;
    appState.gameTrainMotionStoppedAt = null;
    appState.gameTrainMotionStopped = false;
    syncSuggestionTrainMotion(now);
    ensureSuggestionTrainMotionLoop();
    return;
  }

  appState.gameTrainMotionStoppedAt = null;
  appState.gameTrainMotionStopped = false;

  if (!appState.gameRoutePreviewRunning && !appState.activeGameTooltip) {
    startSuggestionTrainMotion();
  }
}

function ensureSuggestionTrainMotionLoop() {
  if (
    appState.screen !== "game" ||
    !appState.gameTrainMotionStarted ||
    appState.gameTrainMotionStopped ||
    gameTrainAnimationFrame
  ) {
    return;
  }

  gameTrainAnimationFrame = window.requestAnimationFrame(stepSuggestionTrainMotion);
}

function stepSuggestionTrainMotion(now) {
  gameTrainAnimationFrame = null;

  if (
    appState.screen !== "game" ||
    !appState.gameTrainMotionStarted ||
    appState.gameTrainMotionStopped
  ) {
    return;
  }

  syncSuggestionTrainMotion(now);
  ensureSuggestionTrainMotionLoop();
}

function stopSuggestionTrainMotion() {
  if (appState.gameTrainMotionStopped) return;

  const now = getGameNow();

  appState.gameTrainMotionStoppedAt = appState.gameTrainMotionStarted ? now : null;
  appState.gameTrainMotionStopped = true;
  clearGameTrainAnimationFrame();
  syncSuggestionTrainMotion(now);
}

function clearGameTrainAnimationFrame() {
  if (!gameTrainAnimationFrame) return;
  window.cancelAnimationFrame(gameTrainAnimationFrame);
  gameTrainAnimationFrame = null;
}

function resetSuggestionGameState() {
  appState.gameDialogVisible = true;
  appState.activeGameTooltip = null;
  appState.gameTooltipIndex = -1;
  appState.gameDisturbanceTooltipNeedsContinue = false;
  appState.gameExplanationLocked = false;
  appState.gameRoutePreviewRunning = false;
  appState.gameTrainMotionStarted = false;
  appState.gameTrainMotionStartedAt = null;
  appState.gameTrainMotionStoppedAt = null;
  appState.gameTrainMotionStopped = false;
  appState.suggestionAccordionExpanded = false;
  appState.suggestionPlanChoices = createDefaultSuggestionPlanChoices();
  appState.suggestionOpenPlanChoiceId = null;
  appState.suggestionPlanExecutionState = "idle";
  appState.suggestionPlanExecutionStartedAt = null;
  appState.suggestionAcceptedPlanItems = [];
  clearGameTooltipTimer();
  clearGameRoutePreviewTimer();
  clearGameTrainAnimationFrame();
  clearSuggestionPlanExecutionTimers();
}

function createDefaultSuggestionPlanChoices() {
  return Object.fromEntries(SUGGESTION_AI_PLAN_ITEMS.map((item) => [item.id, "reject"]));
}

function sampleCubicPoints(start, controlA, controlB, end, steps = 12) {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps;
    const inverse = 1 - t;

    return {
      x:
        inverse ** 3 * start.x +
        3 * inverse ** 2 * t * controlA.x +
        3 * inverse * t ** 2 * controlB.x +
        t ** 3 * end.x,
      y:
        inverse ** 3 * start.y +
        3 * inverse ** 2 * t * controlA.y +
        3 * inverse * t ** 2 * controlB.y +
        t ** 3 * end.y,
    };
  });
}

function createMotionMetrics(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([trainId, points]) => {
      let totalLength = 0;
      const segments = points.slice(0, -1).map((start, index) => {
        const end = points[index + 1];
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const segment = {
          start,
          end,
          length,
          startDistance: totalLength,
          endDistance: totalLength + length,
        };

        totalLength += length;
        return segment;
      });

      return [trainId, { points, segments, totalLength }];
    }),
  );
}

function getGameNow() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function formatPixel(value) {
  return `${Number(value.toFixed(2))}px`;
}

function formatDegree(value) {
  return `${Number(value.toFixed(2))}deg`;
}

function getSuggestionTrain(trainId) {
  return suggestionTrains.find((train) => train.id === trainId);
}

function getSuggestionTrainMotionDistance(now = getGameNow()) {
  if (
    !appState.gameTrainMotionStarted ||
    typeof appState.gameTrainMotionStartedAt !== "number"
  ) {
    return 0;
  }

  const start = appState.gameTrainMotionStartedAt;
  const end = appState.gameTrainMotionStopped
    ? appState.gameTrainMotionStoppedAt || now
    : now;

  return Math.max(0, ((end - start) / 1000) * SUGGESTION_TRAIN_SPEED_PX_PER_SECOND);
}

function getSuggestionTrainMotionState(train, now = getGameNow()) {
  const baseState = {
    left: train.x,
    top: train.y,
    rotation: train.rotate || 0,
    distance: 0,
    point: { x: train.x + train.w / 2, y: train.y + train.h / 2 },
  };

  if (train.disabled || !SUGGESTION_TRAIN_MOTION_METRICS[train.id]) return baseState;

  const distance = getSuggestionTrainMotionDistance(now);
  const sample = sampleSuggestionMotionAt(train.id, distance);
  const rotation = getSuggestionTrainRotation(sample.vector, train.rotate || 0);

  return {
    left: sample.point.x - train.w / 2,
    top: sample.point.y - train.h / 2,
    rotation,
    distance: sample.distance,
    point: sample.point,
  };
}

function sampleSuggestionMotionAt(trainId, distance) {
  const metrics = SUGGESTION_TRAIN_MOTION_METRICS[trainId];
  const fallbackPoint = metrics?.points[0] || { x: 0, y: 0 };

  if (!metrics || metrics.segments.length === 0) {
    return {
      point: fallbackPoint,
      vector: { x: 0, y: -1 },
      distance: 0,
      segmentIndex: 0,
    };
  }

  const clampedDistance = Math.min(Math.max(distance, 0), metrics.totalLength);
  const segmentIndex = metrics.segments.findIndex(
    (segment) => clampedDistance <= segment.endDistance,
  );
  const segment =
    metrics.segments[segmentIndex === -1 ? metrics.segments.length - 1 : segmentIndex];
  const localDistance = clampedDistance - segment.startDistance;
  const progress = segment.length > 0 ? localDistance / segment.length : 0;

  return {
    point: {
      x: segment.start.x + (segment.end.x - segment.start.x) * progress,
      y: segment.start.y + (segment.end.y - segment.start.y) * progress,
    },
    vector: {
      x: segment.end.x - segment.start.x,
      y: segment.end.y - segment.start.y,
    },
    distance: clampedDistance,
    segmentIndex: segmentIndex === -1 ? metrics.segments.length - 1 : segmentIndex,
  };
}

function getSuggestionTrainRotation(vector, fallbackRotation) {
  if (!vector.x && !vector.y) return fallbackRotation;

  const angle = (Math.atan2(vector.y, vector.x) * 180) / Math.PI + 90;
  return angle > 180 ? angle - 360 : angle;
}

function getRemainingSuggestionMotionPoints(trainId, now = getGameNow()) {
  const metrics = SUGGESTION_TRAIN_MOTION_METRICS[trainId];
  if (!metrics) return [];

  const sample = sampleSuggestionMotionAt(trainId, getSuggestionTrainMotionDistance(now));
  const remainingPoints = metrics.points.slice(sample.segmentIndex + 1);

  return [sample.point, ...remainingPoints];
}

function getSuggestionRoutePath(trainId, now = getGameNow()) {
  return pointsToSvgPath(getRemainingSuggestionMotionPoints(trainId, now));
}

function getSuggestionRouteHighlight(routeId, now = getGameNow()) {
  const train = getSuggestionTrain(routeId);
  if (!train) return null;

  const motion = getSuggestionTrainMotionState(train, now);
  return {
    x: motion.left - 10,
    y: motion.top - 10,
    w: train.w + 20,
    h: train.h + 20,
  };
}

function pointsToSvgPath(points) {
  if (points.length < 2) return "";

  const [start, ...rest] = points;
  return [
    `M${Number(start.x.toFixed(2))} ${Number(start.y.toFixed(2))}`,
    ...rest.map((point) => `L${Number(point.x.toFixed(2))} ${Number(point.y.toFixed(2))}`),
  ].join(" ");
}

function getSuggestionTooltipPosition(tooltipId, now = getGameNow()) {
  const tooltip = SUGGESTION_TOOLTIP_CONTENT[tooltipId];
  const train = getSuggestionTrain(tooltipId);

  if (!tooltip) return { x: 0, y: 0 };
  if (!train) return { x: tooltip.x, y: tooltip.y };

  const motion = getSuggestionTrainMotionState(train, now);
  return {
    x: tooltip.x + motion.left - train.x,
    y: tooltip.y + motion.top - train.y,
  };
}

function getSuggestionTooltipArrowStyle(tooltipId, position, now = getGameNow()) {
  const arrowLeft = getSuggestionTooltipArrowLeft(tooltipId, position, now);
  return arrowLeft === null ? "" : `--tooltip-arrow-left: ${formatPixel(arrowLeft)};`;
}

function getSuggestionTooltipArrowLeft(tooltipId, position, now = getGameNow()) {
  const tooltip = SUGGESTION_TOOLTIP_CONTENT[tooltipId];
  const highlight = getSuggestionRouteHighlight(tooltipId, now);
  if (!tooltip || !highlight) return null;

  const arrowSize = 14;
  const rawLeft = highlight.x + highlight.w / 2 - position.x - arrowSize / 2;
  const minLeft = 18;
  const maxLeft = Math.max(minLeft, tooltip.w - 28);

  return Math.max(minLeft, Math.min(maxLeft, rawLeft));
}

function syncSuggestionTrainMotion(now = getGameNow()) {
  if (appState.screen !== "game") return;

  suggestionTrains.forEach((train) => {
    const trainElement = root.querySelector(`[data-train-id="${train.id}"]`);
    if (!trainElement) return;

    const motion = getSuggestionTrainMotionState(train, now);
    trainElement.style.left = formatPixel(motion.left);
    trainElement.style.top = formatPixel(motion.top);
    trainElement.style.setProperty("--train-rotation", formatDegree(motion.rotation));
  });

  syncActiveSuggestionRouteMotion(now);
  syncActiveSuggestionTooltipMotion(now);
}

function syncActiveSuggestionRouteMotion(now = getGameNow()) {
  const route = SUGGESTION_ROUTES[appState.activeGameTooltip];
  if (!route) return;

  const routePath = root.querySelector(".game-route-overlay .game-route-path");
  if (!routePath) return;

  routePath.setAttribute("d", route.path);

  const routeHighlight = root.querySelector(".game-route-overlay .suggestion-route-highlight");
  const highlight = getSuggestionRouteHighlight(appState.activeGameTooltip, now);
  if (!routeHighlight || !highlight) return;

  routeHighlight.setAttribute("x", Number(highlight.x.toFixed(2)));
  routeHighlight.setAttribute("y", Number(highlight.y.toFixed(2)));
  routeHighlight.setAttribute("width", Number(highlight.w.toFixed(2)));
  routeHighlight.setAttribute("height", Number(highlight.h.toFixed(2)));
}

function syncActiveSuggestionTooltipMotion(now = getGameNow()) {
  if (!appState.activeGameTooltip || appState.activeGameTooltip === "brugg") return;

  const tooltipElement = root.querySelector(
    `.game-tooltip[data-tooltip-id="${appState.activeGameTooltip}"]`,
  );
  if (!tooltipElement) return;

  const position = getSuggestionTooltipPosition(appState.activeGameTooltip, now);
  tooltipElement.style.left = formatPixel(position.x);
  tooltipElement.style.top = formatPixel(position.y);

  const arrowLeft = getSuggestionTooltipArrowLeft(appState.activeGameTooltip, position, now);
  if (arrowLeft === null) {
    tooltipElement.style.removeProperty("--tooltip-arrow-left");
  } else {
    tooltipElement.style.setProperty("--tooltip-arrow-left", formatPixel(arrowLeft));
  }
}

function updateGameStageScale() {
  const viewport = root.querySelector(".game-viewport");
  const stage = root.querySelector(".game-stage");
  if (!viewport || !stage) return;

  const viewportWidth = window.visualViewport?.width || viewport.clientWidth;
  const viewportHeight = window.visualViewport?.height || viewport.clientHeight;
  if (!viewportWidth || !viewportHeight) return;

  const scale = Math.min(viewportWidth / 1920, viewportHeight / 1080);
  const left = Math.max(0, (viewportWidth - 1920 * scale) / 2);
  const top = Math.max(0, (viewportHeight - 1080 * scale) / 2);

  stage.style.setProperty("--game-scale", scale);
  stage.style.left = `${left}px`;
  stage.style.top = `${top}px`;
}
