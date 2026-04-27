const API_BASE_CANDIDATES = getApiBaseCandidates()

const STORAGE_KEYS = {
  GAMES_IN_PROGRESS: "truco.gamesInProgress.v2",
  FINISHED_GAMES: "truco.finishedGames.v2",
  CURRENT_GAME_ID: "truco.currentGameId.v2"
}

const SESSION_STORAGE_KEYS = {
  ACTIVE_GAME: "truco.activeGame.v2",
  CURRENT_GAME_ID: "truco.currentGameId.session.v2"
}

const LEGACY_STORAGE_KEYS = {
  ACTIVE_GAME: "truco.activeGame.v1",
  FINISHED_GAMES: "truco.finishedGames.v1"
}

const PLAYER = "human"
const MACHINE = "ai"
const TARGET_SCORE = 30
const MAX_IN_PROGRESS_GAMES = 10
const FINISHED_PAGE_SIZE = 10

const MODE_TRUCO_ENVIDO = "truco_envido"
const MODE_TRUCO_ENVIDO_FLOR = "truco_envido_flor"

const TRUCO_POINTS_BY_LEVEL = [1, 2, 3, 4]
const TRUCO_NAMES = ["Sin cantar", "Truco", "Retruco", "Vale Cuatro"]
const THINKING_MESSAGES = [
  "Mucha confianza te veo...",
  "Qué silencio se armó de golpe",
  "Me parece que te estás apurando",
  "Me hacés dudar con esa cara",
  "Mmm, me gusta para dar una sorpresa",
  "A ver si te da el cuero",
  "Te estoy leyendo como un libro abierto",
  "No te vayas a arrepentir ahora",
  "Si sabés jugar, sabés qué tengo",
  "Qué linda tarde se puso para jugar",
  "Dale, que se nos enfría el agua del mate",
  "Yo que vos, me guardo esa para después",
  "Esta mano viene con aroma raro",
  "Falta mucho todavía para que cantes victoria",
  "Te la dejo picando, vos verás...",
]

function getClosedRoundResultModal() {
  return {
    open: false,
    gameId: null,
    handNumber: 0,
    roundWinner: null,
    roundPoints: 0,
    scoreHuman: 0,
    scoreMachine: 0,
    humanName: "",
    machineName: "",
    matchWillFinish: false,
    matchWinner: null
  }
}

const app = document.querySelector("#app")

let _noticeTimer = null
function showNotice(msg) {
  state.homeNotice = msg
  if (_noticeTimer) clearTimeout(_noticeTimer)
  render()
  _noticeTimer = setTimeout(() => {
    state.homeNotice = ""
    _noticeTimer = null
    render()
  }, 4000)
}

// ── Game toasts ─────────────────────────────────────────
// Contenedor persistente fuera de #app: no participa del ciclo render(),
// por lo que los toasts existentes no se re-renderizan al llegar uno nuevo.
// Cada toast entra con animación slide-from-right y se agrega encima del anterior.
// Mínimo 5 s visible; se eliminan al presionar un botón de juego o al iniciar mano.

let _gameToastEl = null
let _langAudio = null

function _getGameToastContainer() {
  if (!_gameToastEl) {
    _gameToastEl = document.createElement("div")
    _gameToastEl.className = "px-game-toast-stack"
    _gameToastEl.setAttribute("role", "status")
    _gameToastEl.setAttribute("aria-live", "polite")
    _gameToastEl.addEventListener("click", (event) => {
      const toast = event.target.closest(".px-game-toast")
      if (!toast) return
      const { id } = toast.dataset
      toast.remove()
      state.gameToasts = state.gameToasts.filter((t) => t.id !== id)
    })
    document.body.appendChild(_gameToastEl)
  }
  return _gameToastEl
}

function addGameToast(message) {
  const id = crypto.randomUUID()
  state.gameToasts.push({ id, clearable: false })

  const container = _getGameToastContainer()
  const el = document.createElement("div")
  el.className = "px-game-toast"
  el.dataset.id = id
  el.innerHTML = `<span class="px-game-toast-content">${formatGameToastMessage(message)}</span>`
  container.prepend(el)           // nuevo arriba, sin tocar los existentes

  setTimeout(() => {
    const t = state.gameToasts.find((x) => x.id === id)
    if (t) t.clearable = true
  }, 5000)
}

function formatGameToastMessage(message) {
  const safeText = escapeHtml(message || "")
  const isWordLike = (char) => /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/.test(char)
  return safeText.replace(/\d+/g, (match, offset, source) => {
    const prev = offset > 0 ? source[offset - 1] : ""
    const next = offset + match.length < source.length ? source[offset + match.length] : ""
    const leftPad = prev && isWordLike(prev) ? " " : ""
    const rightPad = next && isWordLike(next) ? " " : ""
    return `${leftPad}<span class="px-game-toast-num">${match}</span>${rightPad}`
  })
}

// Elimina solo los toasts que ya cumplieron los 5 s mínimos
function clearGameToasts() {
  if (!_gameToastEl) return
  state.gameToasts = state.gameToasts.filter((t) => {
    if (!t.clearable) return true
    _gameToastEl.querySelector(`[data-id="${t.id}"]`)?.remove()
    return false
  })
}

// Elimina TODOS los toasts (nueva mano, salir al home)
function clearAllGameToasts() {
  state.gameToasts = []
  if (_gameToastEl) _gameToastEl.innerHTML = ""
}

const state = {
  cards: [],
  loadingCards: true,
  cardsError: null,
  view: "home",
  gamesInProgress: [],
  currentGameId: null,
  finishedGames: [],
  homePagination: {
    finishedPage: 0,
    pageSize: FINISHED_PAGE_SIZE
  },
  createGameModal: {
    open: false,
    mode: null,
    draftName: "",
    error: ""
  },
  roundResultModal: getClosedRoundResultModal(),
  homeDraftNames: {
    [MODE_TRUCO_ENVIDO]: "",
    [MODE_TRUCO_ENVIDO_FLOR]: ""
  },
  confirmDrawGameId: null,
  langModal: { open: false },
  pendingCreation: null,
  homeNotice: "",
  gameToasts: []
}

init()

async function init() {
  bindEvents()
  hydrateGamesFromStorage()
  await fetchCards()
  render()
}

function bindEvents() {
  app.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]")
    if (!target) return
    const { action } = target.dataset

    if (action === "try-english") {
      openLangModal()
      return
    }

    if (action === "close-lang-modal") {
      closeLangModal()
      return
    }

    if (action === "open-create-game-modal") {
      openCreateGameModal(target.dataset.mode)
      return
    }

    if (action === "confirm-create-game") {
      await confirmCreateGame()
      return
    }

    if (action === "cancel-create-game") {
      cancelCreateGameModal()
      return
    }

    if (action === "confirm-close-oldest-and-create") {
      await confirmCloseOldestAndCreate()
      return
    }

    if (action === "dismiss-limit-warning") {
      state.pendingCreation = null
      render()
      return
    }
    if (action === "dismiss-home-notice") {
      state.homeNotice = ""
      if (_noticeTimer) {
        clearTimeout(_noticeTimer)
        _noticeTimer = null
      }
      render()
      return
    }

    if (action === "resume-mode") {
      const mode = target.dataset.mode
      resumeLatestByMode(mode)
      return
    }

    if (action === "join-game") {
      const gameId = target.dataset.gameId
      joinGame(gameId)
      return
    }

    if (action === "finished-prev") {
      state.homePagination.finishedPage = Math.max(0, state.homePagination.finishedPage - 1)
      render()
      return
    }

    if (action === "finished-next") {
      const totalPages = getFinishedTotalPages()
      state.homePagination.finishedPage = Math.min(totalPages - 1, state.homePagination.finishedPage + 1)
      render()
      return
    }

    if (action === "go-home") {
      state.view = "home"
      persistGamesState()
      render()
      return
    }
    if (action === "request-close-draw") {
      state.confirmDrawGameId = target.dataset.gameId || null
      render()
      return
    }
    if (action === "modal-panel") {
      return
    }
    if (action === "confirm-close-draw") {
      const gameId = target.dataset.gameId || state.confirmDrawGameId
      const gameToClose = findGameById(gameId)
      if (gameToClose) {
        finishGameAsDraw(gameToClose)
      }
      return
    }
    if (action === "cancel-close-draw") {
      state.confirmDrawGameId = null
      render()
      return
    }
    if (action === "continue-round-result") {
      continueRoundResult()
      return
    }
    if (action === "round-result-panel" || action === "round-result-overlay") {
      return
    }

    const game = getCurrentGame()
    if (!game || game.status !== "in_progress") return
    if (isRoundResultModalOpenForGame(game.id)) return

    clearGameToasts()

    if (action === "play-card") {
      const cardId = Number(target.dataset.cardId)
      playHumanCard(game, cardId)
      return
    }

    if (action === "call-truco") {
      humanCallTruco(game)
      return
    }

    if (action === "call-envido") {
      humanCallEnvido(game, "envido")
      return
    }

    if (action === "call-real-envido") {
      humanCallEnvido(game, "real_envido")
      return
    }

    if (action === "call-falta-envido") {
      humanCallEnvido(game, "falta_envido")
      return
    }

    if (action === "call-flor") {
      humanCallFlor(game)
      return
    }
    if (action === "go-to-mazo") {
      humanGoToMazo(game)
      return
    }
    if (action === "reply-call") {
      resolveHumanReply(game, target.dataset.reply)
      return
    }

    if (action === "reply-envido") {
      humanCallEnvidoAsTrucoReply(game, target.dataset.kind)
      return
    }
    if (action === "reply-flor") {
      humanCallFlorAsTrucoReply(game)
      return
    }

    if (action === "toggle-pile") {
      const player = target.dataset.player
      togglePileDetail(game, player)
    }
  })

  app.addEventListener("input", (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.dataset.action !== "set-create-name") return
    if (!state.createGameModal.open) return
    state.createGameModal.draftName = target.value || ""
    if (state.createGameModal.error) {
      state.createGameModal.error = ""
      render()
    }
  })

  app.addEventListener("keydown", async (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.dataset.action !== "set-create-name") return
    if (!state.createGameModal.open) return
    if (event.key !== "Enter") return
    event.preventDefault()
    await confirmCreateGame()
  })
}

function isRoundResultModalOpenForGame(gameId) {
  return state.roundResultModal.open && state.roundResultModal.gameId === gameId
}

function openRoundResultModal(game, payload) {
  if (!game || game.status !== "in_progress") return

  state.roundResultModal = {
    open: true,
    gameId: game.id,
    handNumber: payload.handNumber,
    roundWinner: payload.roundWinner,
    roundPoints: payload.roundPoints,
    scoreHuman: game.scores[PLAYER],
    scoreMachine: game.scores[MACHINE],
    humanName: game.players.humanName,
    machineName: game.players.machineName,
    matchWillFinish: payload.matchWillFinish,
    matchWinner: payload.matchWinner || null
  }
}

function closeRoundResultModal() {
  state.roundResultModal = getClosedRoundResultModal()
}

function continueRoundResult() {
  const modal = state.roundResultModal
  if (!modal.open || !modal.gameId) return

  const game = findGameById(modal.gameId)
  const shouldFinishMatch = modal.matchWillFinish
  const matchWinner = modal.matchWinner

  closeRoundResultModal()

  if (!game || game.status !== "in_progress") {
    render()
    return
  }

  if (shouldFinishMatch && matchWinner) {
    finishGame(game, matchWinner)
    return
  }

  startNextHand(game)
}

async function fetchCards() {
  state.loadingCards = true
  state.cardsError = null
  let lastError = "No se pudieron obtener las cartas desde la API local"

  for (const apiBaseUrl of API_BASE_CANDIDATES) {
    const endpoint = `${apiBaseUrl}/cards`
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const payload = await response.json()
      if (!Array.isArray(payload) || !payload.length) {
        throw new Error("La API respondió sin cartas")
      }

      state.cards = payload
      state.loadingCards = false
      return
    } catch (error) {
      lastError = `${endpoint} -> ${error?.message || "Error inesperado de red"}`
    }
  }

  state.cardsError = lastError
  state.loadingCards = false
}

function getApiBaseCandidates() {
  const hostname = window.location.hostname
  const bases = ["/api"]

  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    bases.push(`http://${hostname}:3000`)
  }

  bases.push("http://localhost:3000")
  return [...new Set(bases)]
}

function hydrateGamesFromStorage() {
  const currentV2Games = loadFromStorage(STORAGE_KEYS.GAMES_IN_PROGRESS, [])
  const currentV2Finished = loadFromStorage(STORAGE_KEYS.FINISHED_GAMES, [])
  const currentSessionCurrentId = loadFromSessionStorage(SESSION_STORAGE_KEYS.CURRENT_GAME_ID, null)
  const currentSessionActiveGame = loadFromSessionStorage(SESSION_STORAGE_KEYS.ACTIVE_GAME, null)
  const legacyLocalCurrentId = loadFromStorage(STORAGE_KEYS.CURRENT_GAME_ID, null)

  state.gamesInProgress = normalizeGamesInProgress(currentV2Games)
  state.finishedGames = normalizeFinishedGames(currentV2Finished)
  state.currentGameId = currentSessionCurrentId || legacyLocalCurrentId

  migrateLegacyStorageIfNeeded()

  if (currentSessionActiveGame?.status === "in_progress") {
    const migratedActive = migrateGameToV2(currentSessionActiveGame)
    const activeId = String(migratedActive.id)
    const index = state.gamesInProgress.findIndex((game) => String(game.id) === activeId)
    if (index >= 0) {
      state.gamesInProgress[index] = migratedActive
    } else {
      state.gamesInProgress.push(migratedActive)
    }
    state.gamesInProgress = state.gamesInProgress
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, MAX_IN_PROGRESS_GAMES)
    state.currentGameId = migratedActive.id
  }

  if (!findGameById(state.currentGameId)) {
    state.currentGameId = null
  }

  if (!state.currentGameId) {
    state.view = "home"
  }

  clampFinishedPage()
  persistGamesState()
}

function migrateLegacyStorageIfNeeded() {
  const legacyActive = loadLegacyActiveFromSession()
  if (legacyActive?.status === "in_progress") {
    const migratedActive = migrateGameToV2(legacyActive)
    if (!findGameById(migratedActive.id)) {
      state.gamesInProgress.push(migratedActive)
      if (!state.currentGameId) {
        state.currentGameId = migratedActive.id
      }
    }
    try {
      sessionStorage.removeItem(LEGACY_STORAGE_KEYS.ACTIVE_GAME)
    } catch {
      // ignore storage cleanup failures
    }
  }

  if (!state.finishedGames.length) {
    const legacyFinished = loadFromStorage(LEGACY_STORAGE_KEYS.FINISHED_GAMES, [])
    if (Array.isArray(legacyFinished) && legacyFinished.length) {
      state.finishedGames = normalizeFinishedGames(legacyFinished)
    }
  }

  state.gamesInProgress = state.gamesInProgress
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, MAX_IN_PROGRESS_GAMES)
}

function loadLegacyActiveFromSession() {
  try {
    const raw = sessionStorage.getItem(LEGACY_STORAGE_KEYS.ACTIVE_GAME)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeGamesInProgress(rawGames) {
  if (!Array.isArray(rawGames)) return []
  const migrated = rawGames
    .map((game) => migrateGameToV2(game))
    .filter((game) => game.status === "in_progress")

  const uniqueById = new Map()
  for (const game of migrated) {
    uniqueById.set(String(game.id), game)
  }

  return [...uniqueById.values()]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, MAX_IN_PROGRESS_GAMES)
}

function normalizeFinishedGames(rawGames) {
  if (!Array.isArray(rawGames)) return []
  return rawGames
    .map((game) => migrateFinishedGameToV2(game))
    .sort((a, b) => new Date(b.finishedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.finishedAt || a.updatedAt || a.createdAt).getTime())
}

function migrateGameToV2(game) {
  const now = new Date().toISOString()
  const migrated = { ...game }

  migrated.id = migrated.id || crypto.randomUUID()
  migrated.createdAt = migrated.createdAt || now
  migrated.updatedAt = migrated.updatedAt || now
  migrated.status = migrated.status || "in_progress"
  migrated.mode = migrated.mode === MODE_TRUCO_ENVIDO ? MODE_TRUCO_ENVIDO : MODE_TRUCO_ENVIDO_FLOR
  migrated.players = {
    humanName: migrated.players?.humanName || "Jugador",
    machineName: "Máquina"
  }
  migrated.targetScore = migrated.targetScore || TARGET_SCORE
  migrated.scores = {
    [PLAYER]: Number(migrated.scores?.[PLAYER] ?? migrated.scores?.human ?? 0),
    [MACHINE]: Number(migrated.scores?.[MACHINE] ?? migrated.scores?.ai ?? 0)
  }

  if (!Array.isArray(migrated.drawPile)) {
    migrated.drawPile = shuffle([...state.cards])
  }
  if (!Array.isArray(migrated.lastHandCardIds)) {
    migrated.lastHandCardIds = []
  }
  if (!Array.isArray(migrated.log)) {
    migrated.log = []
  }
  if (migrated.pendingMachineTrucoReply === undefined) {
    migrated.pendingMachineTrucoReply = null
  }

  if (!migrated.currentHand && migrated.status === "in_progress") {
    migrated.handNumber = migrated.handNumber || 0
    migrated.dealer = migrated.dealer || MACHINE
    migrated.machineThinking = false
    migrated.machineThinkingMessage = ""
    migrated.waitingReply = null
    migrated.currentHand = null
    startNextHand(migrated, { skipRender: true })
  }

  return migrated
}

function migrateFinishedGameToV2(game) {
  const now = new Date().toISOString()
  const winner =
    Object.prototype.hasOwnProperty.call(game || {}, "winner")
      ? game.winner
      : MACHINE
  return {
    id: game.id || crypto.randomUUID(),
    createdAt: game.createdAt || now,
    updatedAt: game.updatedAt || game.finishedAt || now,
    finishedAt: game.finishedAt || game.updatedAt || now,
    status: "finished",
    mode: game.mode === MODE_TRUCO_ENVIDO ? MODE_TRUCO_ENVIDO : MODE_TRUCO_ENVIDO_FLOR,
    players: {
      humanName: game.players?.humanName || "Jugador",
      machineName: "Máquina"
    },
    winner,
    scores: {
      [PLAYER]: Number(game.scores?.[PLAYER] ?? game.scores?.human ?? 0),
      [MACHINE]: Number(game.scores?.[MACHINE] ?? game.scores?.ai ?? 0)
    }
  }
}

function openLangModal() {
  if (_langAudio) {
    _langAudio.pause()
    _langAudio.currentTime = 0
  }
  _langAudio = new Audio("assets/ui/NingunHello.mov")
  _langAudio.play().catch(() => {})
  state.langModal.open = true
  render()
}

function closeLangModal() {
  if (_langAudio) {
    _langAudio.pause()
    _langAudio.currentTime = 0
    _langAudio = null
  }
  state.langModal.open = false
  render()
}

function openCreateGameModal(mode) {
  if (!mode) return
  state.createGameModal = {
    open: true,
    mode,
    draftName: state.homeDraftNames[mode] || "",
    error: ""
  }
  render()
}

function cancelCreateGameModal() {
  state.createGameModal = {
    open: false,
    mode: null,
    draftName: "",
    error: ""
  }
  render()
}

async function confirmCreateGame() {
  if (!state.createGameModal.open || !state.createGameModal.mode) return
  if (!state.cards.length) {
    renderMessage("No hay cartas cargadas. Levantá la API (`npm run api`) y reintentá.")
    return
  }

  const mode = state.createGameModal.mode
  const rawName = state.createGameModal.draftName || ""
  const humanName = rawName.trim()

  if (!humanName) {
    state.createGameModal.error = "Ingresá un nombre para crear la partida."
    render()
    return
  }

  state.homeDraftNames[mode] = rawName
  state.homeNotice = ""
  state.createGameModal = {
    open: false,
    mode: null,
    draftName: "",
    error: ""
  }

  if (state.gamesInProgress.length >= MAX_IN_PROGRESS_GAMES) {
    state.pendingCreation = { mode, humanName }
    render()
    return
  }

  createNewGame(mode, humanName)
}

async function confirmCloseOldestAndCreate() {
  if (!state.pendingCreation) return

  const oldest = [...state.gamesInProgress].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0]

  if (oldest) {
    state.gamesInProgress = state.gamesInProgress.filter((game) => game.id !== oldest.id)
    if (state.currentGameId === oldest.id) {
      state.currentGameId = null
      state.view = "home"
    }
    showNotice(`Se cerró la partida más antigua (${oldest.players.humanName}, ${formatModeLabel(oldest.mode)}) para liberar cupo.`)
  }

  const { mode, humanName } = state.pendingCreation
  state.pendingCreation = null
  createNewGame(mode, humanName)
}

function createNewGame(mode, humanName) {
  const game = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "in_progress",
    winner: null,
    finishedAt: null,
    mode,
    players: {
      humanName,
      machineName: "Máquina"
    },
    targetScore: TARGET_SCORE,
    scores: {
      [PLAYER]: 0,
      [MACHINE]: 0
    },
    handNumber: 0,
    dealer: MACHINE,
    machineThinking: false,
    machineThinkingMessage: "",
    waitingReply: null,
    pendingMachineTrucoReply: null,
    drawPile: shuffle([...state.cards]),
    lastHandCardIds: [],
    log: []
  }

  state.gamesInProgress.push(game)
  state.gamesInProgress = state.gamesInProgress
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, MAX_IN_PROGRESS_GAMES)

  state.currentGameId = game.id
  state.view = "game"
  state.pendingCreation = null
  state.homeNotice = ""

  addLog(game, `Partida nueva creada por ${game.players.humanName}.`)
  startNextHand(game)
}

function resumeLatestByMode(mode) {
  const candidates = state.gamesInProgress
    .filter((game) => game.mode === mode)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const latest = candidates[0]
  if (!latest) {
    showNotice(`No hay partidas en curso para ${formatModeLabel(mode)}.`)
    return
  }

  state.currentGameId = latest.id
  state.view = "game"
  persistGamesState()
  render()
  maybeRunMachineTurn(latest)
}

function joinGame(gameId) {
  const game = findGameById(gameId)
  if (!game || game.status !== "in_progress") return
  state.currentGameId = game.id
  state.view = "game"
  persistGamesState()
  render()
  maybeRunMachineTurn(game)
}

function startNextHand(game, options = {}) {
  clearAllGameToasts()
  if (state.roundResultModal.gameId === game.id) {
    closeRoundResultModal()
  }
  game.handNumber += 1
  game.dealer = game.dealer === PLAYER ? MACHINE : PLAYER
  const mano = game.dealer === PLAYER ? MACHINE : PLAYER

  const { humanHand, aiHand } = dealHands(game, mano)
  const florEnabled = game.mode === MODE_TRUCO_ENVIDO_FLOR
  const florInHand = florEnabled && (hasFlor(aiHand) || hasFlor(humanHand))

  game.currentHand = {
    mano,
    turn: mano,
    trickNumber: 1,
    table: [],
    trickWins: { [PLAYER]: 0, [MACHINE]: 0 },
    trickHistory: [],
    humanHand,
    aiHand,
    trucoLevel: 0,
    trucoAcceptedLevel: 0,
    trucoCanRaiseBy: null,
    openPile: null,
    envido: { status: florInHand ? "blocked" : "available" },
    flor: { status: florInHand ? "available" : "blocked" },
    resolved: false
  }

  game.lastHandCardIds = [...humanHand, ...aiHand].map((card) => String(card.id))
  addLog(game, `Mano ${game.handNumber} iniciada. Sale ${mano === PLAYER ? "jugador" : "máquina"}.`)

  if (florInHand) {
    addLog(game, "Hay Flor disponible en esta mano. Envido bloqueado por reglamento.")
  }

  game.waitingReply = null
  game.pendingMachineTrucoReply = null
  stopMachineThinking(game)
  game.updatedAt = new Date().toISOString()

  persistGamesState()
  if (!options.skipRender) {
    render()
    maybeRunMachineTurn(game)
  }
}

function playHumanCard(game, cardId) {
  const hand = game.currentHand
  if (!isHumanTurnReady(game)) return

  const idx = hand.humanHand.findIndex((card) => String(card.id) === String(cardId))
  if (idx === -1) return

  const [card] = hand.humanHand.splice(idx, 1)
  hand.table.push({ player: PLAYER, card })
  addLog(game, `${game.players.humanName} juega ${labelCard(card)}.`)
  resolveTableIfNeeded(game)
}

function playMachineCard(game) {
  const hand = game.currentHand
  if (hand.turn !== MACHINE || hand.resolved) return

  const card = chooseMachineCard(hand)
  const idx = hand.aiHand.findIndex((c) => String(c.id) === String(card.id))
  if (idx === -1) return

  hand.aiHand.splice(idx, 1)
  hand.table.push({ player: MACHINE, card })
  addLog(game, `Máquina juega  ${labelCard(card)}.`)
  resolveTableIfNeeded(game)
}

function chooseMachineCard(hand) {
  const sorted = [...hand.aiHand].sort((a, b) => cardStrength(a) - cardStrength(b))

  if (hand.table.length === 1 && hand.table[0].player === PLAYER) {
    const targetStrength = cardStrength(hand.table[0].card)
    const winnerCard = sorted.find((card) => cardStrength(card) > targetStrength)
    return winnerCard ?? sorted[0]
  }

  if (hand.trickWins[MACHINE] > hand.trickWins[PLAYER]) {
    return sorted[0]
  }

  return sorted[sorted.length - 1]
}

function resolveTableIfNeeded(game) {
  const hand = game.currentHand

  if (hand.table.length === 1) {
    hand.turn = hand.table[0].player === PLAYER ? MACHINE : PLAYER
    game.updatedAt = new Date().toISOString()
    persistGamesState()
    render()
    maybeRunMachineTurn(game)
    return
  }

  if (hand.table.length < 2) return

  const [first, second] = hand.table
  const firstStrength = cardStrength(first.card)
  const secondStrength = cardStrength(second.card)

  let trickWinner
  if (firstStrength === secondStrength) {
    trickWinner = null
    addLog(game, `Mano ${hand.trickNumber}: parda.`)
  } else {
    trickWinner = firstStrength > secondStrength ? first.player : second.player
    addLog(game, `Mano ${hand.trickNumber}: gana ${trickWinner === PLAYER ? game.players.humanName : "máquina"}.`)
  }

  if (trickWinner) {
    hand.trickWins[trickWinner] += 1
  }

  const completedTrickNumber = hand.trickNumber
  hand.trickHistory.push({
    number: hand.trickNumber,
    plays: [first, second],
    winner: trickWinner
  })

  hand.trickNumber += 1
  hand.table = []
  hand.turn = getNextTurnAfterTrick(hand, trickWinner, completedTrickNumber)

  const handWinner = getHandWinner(hand)
  if (handWinner) {
    resolveHand(game, handWinner)
    return
  }

  game.updatedAt = new Date().toISOString()
  persistGamesState()
  render()
  maybeRunMachineTurn(game)
}

function getHandWinner(hand) {
  if (hand.trickWins[PLAYER] >= 2) return PLAYER
  if (hand.trickWins[MACHINE] >= 2) return MACHINE

  const winners = hand.trickHistory.map((trick) => trick.winner)
  const first = winners[0]
  const second = winners[1]
  const third = winners[2]

  if (winners.length >= 2) {
    if (first && second === first) return first
    if (first && second === null) return first
    if (first === null && second) return second
  }

  if (winners.length >= 3) {
    if (third) return third
    return hand.mano
  }

  const noCardsLeft = hand.humanHand.length === 0 && hand.aiHand.length === 0
  if (!noCardsLeft) return null
  return hand.mano
}

function resolveHand(game, winner) {
  const hand = game.currentHand
  hand.resolved = true
  const points = TRUCO_POINTS_BY_LEVEL[hand.trucoAcceptedLevel]
  game.scores[winner] += points

  addLog(game, `Mano para ${winner === PLAYER ? game.players.humanName : "máquina"} (+${points}).`)
  const matchWillFinish = game.scores[winner] >= game.targetScore

  game.updatedAt = new Date().toISOString()
  stopMachineThinking(game)
  openRoundResultModal(game, {
    handNumber: game.handNumber,
    roundWinner: winner,
    roundPoints: points,
    matchWillFinish,
    matchWinner: matchWillFinish ? winner : null
  })
  persistGamesState()
  render()
}

function humanGoToMazo(game) {
  const hand = game.currentHand
  if (!hand || hand.resolved) return
  if (!isHumanTurnReady(game)) return

  const pointsInPlay = TRUCO_POINTS_BY_LEVEL[hand.trucoAcceptedLevel] || 1
  hand.resolved = true
  game.scores[MACHINE] += pointsInPlay
  addLog(game, `${game.players.humanName} se va al mazo. Mano para máquina (+${pointsInPlay}).`)
  const matchWillFinish = game.scores[MACHINE] >= game.targetScore

  game.updatedAt = new Date().toISOString()
  stopMachineThinking(game)
  openRoundResultModal(game, {
    handNumber: game.handNumber,
    roundWinner: MACHINE,
    roundPoints: pointsInPlay,
    matchWillFinish,
    matchWinner: matchWillFinish ? MACHINE : null
  })
  persistGamesState()
  render()
}

function finishGame(game, winner) {
  game.status = "finished"
  game.winner = winner
  game.finishedAt = new Date().toISOString()
  game.updatedAt = new Date().toISOString()

  addLog(game, `Partida terminada. Ganador: ${winner === PLAYER ? game.players.humanName : "máquina"}.`)

  const finishedRecord = {
    id: game.id,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    finishedAt: game.finishedAt,
    status: "finished",
    mode: game.mode,
    players: game.players,
    winner: game.winner,
    scores: game.scores
  }

  state.finishedGames.unshift(finishedRecord)
  state.gamesInProgress = state.gamesInProgress.filter((item) => item.id !== game.id)

  if (state.currentGameId === game.id) {
    state.currentGameId = null
    state.view = "home"
  }
  if (state.roundResultModal.gameId === game.id) {
    closeRoundResultModal()
  }

  clampFinishedPage()
  persistGamesState()
  render()
}

function finishGameAsDraw(game) {
  game.status = "finished"
  game.winner = null
  game.finishedAt = new Date().toISOString()
  game.updatedAt = new Date().toISOString()

  addLog(game, "Partida finalizada en empate.")

  const finishedRecord = {
    id: game.id,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    finishedAt: game.finishedAt,
    status: "finished",
    mode: game.mode,
    players: game.players,
    winner: null,
    scores: game.scores
  }

  state.finishedGames.unshift(finishedRecord)
  state.gamesInProgress = state.gamesInProgress.filter((item) => item.id !== game.id)

  if (state.currentGameId === game.id) {
    state.currentGameId = null
    state.view = "home"
  }
  if (state.roundResultModal.gameId === game.id) {
    closeRoundResultModal()
  }
  state.confirmDrawGameId = null
  clampFinishedPage()
  persistGamesState()
  showNotice(`La partida de ${game.players.humanName} contra Máquina se cerró en empate.`)
}

function humanCallTruco(game) {
  const hand = game.currentHand
  if (!isHumanTurnReady(game) || hand.resolved) return
  if (!canPlayerCallTruco(hand, PLAYER)) return

  hand.trucoLevel += 1
  const level = hand.trucoLevel
  addLog(game, `${game.players.humanName} canta ${TRUCO_NAMES[level]}.`)
  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return
    const activeHand = activeGame.currentHand
    const pseudoTrucoTicket = { type: "truco", level }

    if (canCallFlorAsTrucoReply(activeGame, activeHand, MACHINE, pseudoTrucoTicket)) {
      activeGame.pendingMachineTrucoReply = { level, by: MACHINE }
      activeGame.waitingReply = {
        type: "flor",
        label: "Flor",
        options: ["accept", "reject"]
      }
      activeHand.flor.status = "pending"
      activeHand.envido.status = "blocked"
      addLog(activeGame, "¡La flor está primero!")
      addLog(activeGame, "Máquina canta Flor.")
      stopMachineThinking(activeGame)
      persistGamesState()
      render()
      return
    }

    const aiAccepts = machineAcceptTruco(activeHand, level)
    if (aiAccepts) {
      activeHand.trucoAcceptedLevel = level
      activeHand.trucoCanRaiseBy = MACHINE
      addLog(activeGame, `Máquina acepta ${TRUCO_NAMES[level]}.`)
    } else {
      const points = TRUCO_POINTS_BY_LEVEL[level - 1]
      addLog(activeGame, `Máquina no quiere ${TRUCO_NAMES[level]}. ${activeGame.players.humanName} suma ${points}.`)
      activeGame.scores[PLAYER] += points
      activeHand.resolved = true
      const matchWillFinish = activeGame.scores[PLAYER] >= activeGame.targetScore
      stopMachineThinking(activeGame)
      activeGame.updatedAt = new Date().toISOString()
      openRoundResultModal(activeGame, {
        handNumber: activeGame.handNumber,
        roundWinner: PLAYER,
        roundPoints: points,
        matchWillFinish,
        matchWinner: matchWillFinish ? PLAYER : null
      })
      persistGamesState()
      render()
      return
    }

    stopMachineThinking(activeGame)
    persistGamesState()
    render()
  }, randomMachineDelay())
}

function machineAcceptTruco(hand, level) {
  const power = hand.aiHand.reduce((sum, card) => sum + cardStrength(card), 0) / Math.max(hand.aiHand.length, 1)
  const thresholdByLevel = [0, 6.5, 8.5, 10.5]
  const chance = Math.min(0.95, Math.max(0.15, (power - thresholdByLevel[level]) / 6 + 0.55))
  return Math.random() < chance
}

function getMachineEnvidoPolicy(aiPoints) {
  const policy = {
    accept: {
      envido: 0,
      real_envido: 0,
      falta_envido: 0
    },
    call: {
      envido: 0,
      real_envido: 0,
      falta_envido: 0
    }
  }

  if (aiPoints >= 28 && aiPoints <= 33) {
    policy.accept.envido = 1
    policy.accept.real_envido = 1
    policy.call.envido = 1
    policy.call.real_envido = 1
  } else if (aiPoints >= 20 && aiPoints <= 27) {
    policy.accept.envido = 1
    policy.accept.real_envido = 0.1
    policy.call.envido = 1
    policy.call.real_envido = 0.1
  } else if (aiPoints < 20) {
    policy.accept.envido = 0.15
    policy.accept.real_envido = 0
    policy.call.envido = 0.15
    policy.call.real_envido = 0
  }

  if (aiPoints === 32 || aiPoints === 33) {
    policy.accept.falta_envido = 1
    policy.call.falta_envido = 1
  }

  return policy
}

function machineAcceptEnvido(kind, hand) {
  const aiPoints = calcEnvidoScore(hand.aiHand.concat(getPlayedCards(hand, MACHINE)))
  const policy = getMachineEnvidoPolicy(aiPoints)
  const chance = policy.accept[kind] ?? 0
  return Math.random() < chance
}

function humanCallEnvido(game, kind) {
  const hand = game.currentHand
  if (!isHumanTurnReady(game) || hand.resolved) return
  if (!canCallEnvidoByPlayer(game, hand, PLAYER)) return

  const announce = kind === "envido" ? "Envido" : kind === "real_envido" ? "Real Envido" : "Falta Envido"
  if (shouldLogEnvidoPrimero(hand, PLAYER)) {
    addLog(game, "¡El envido está primero!")
  }
  addLog(game, `${game.players.humanName} canta ${announce}.`)
  hand.envido.status = "pending"
  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return
    const activeHand = activeGame.currentHand

    const accept = machineAcceptEnvido(kind, activeHand)
    if (!accept) {
      const points = 1
      activeGame.scores[PLAYER] += points
      activeHand.envido = { status: "resolved", winner: PLAYER, points }
      addLog(activeGame, `Máquina no quiere ${announce}. ${activeGame.players.humanName} suma ${points}.`)
    } else {
      const humanPoints = calcEnvidoScore(activeHand.humanHand.concat(getPlayedCards(activeHand, PLAYER)))
      const aiPoints = calcEnvidoScore(activeHand.aiHand.concat(getPlayedCards(activeHand, MACHINE)))
      const winner = humanPoints >= aiPoints ? PLAYER : MACHINE
      const points = envidoPoints(kind, activeGame)
      activeGame.scores[winner] += points
      activeHand.envido = { status: "resolved", winner, points }
      addLog(activeGame, `Envido aceptado (${humanPoints} vs ${aiPoints}). Gana ${winner === PLAYER ? activeGame.players.humanName : "máquina"} (+${points}).`)
    }

    stopMachineThinking(activeGame)
    checkScoreAfterSideBet(activeGame)
    persistGamesState()
    render()
    maybeRunMachineTurn(activeGame)
  }, randomMachineDelay())
}

function humanCallEnvidoAsTrucoReply(game, kind) {
  const hand = game.currentHand
  const ticket = game.waitingReply
  if (!hand || !ticket) return
  if (ticket.type !== "truco") return
  if (!canCallEnvidoAsTrucoReply(hand, ticket)) return

  const announce = kind === "envido" ? "Envido" : kind === "real_envido" ? "Real Envido" : "Falta Envido"
  if (shouldLogEnvidoPrimero(hand, PLAYER, ticket)) {
    addLog(game, "¡El envido está primero!")
  }
  addLog(game, `${game.players.humanName} canta ${announce} (antes de responder el Truco).`)
  hand.envido.status = "pending"
  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return
    const activeHand = activeGame.currentHand

    const accept = machineAcceptEnvido(kind, activeHand)
    if (!accept) {
      const points = 1
      activeGame.scores[PLAYER] += points
      activeHand.envido = { status: "resolved", winner: PLAYER, points }
      addLog(activeGame, `Máquina no quiere ${announce}. ${activeGame.players.humanName} suma ${points}.`)
    } else {
      const humanPoints = calcEnvidoScore(activeHand.humanHand.concat(getPlayedCards(activeHand, PLAYER)))
      const aiPoints = calcEnvidoScore(activeHand.aiHand.concat(getPlayedCards(activeHand, MACHINE)))
      const winner = humanPoints >= aiPoints ? PLAYER : MACHINE
      const points = envidoPoints(kind, activeGame)
      activeGame.scores[winner] += points
      activeHand.envido = { status: "resolved", winner, points }
      addLog(activeGame, `Envido aceptado (${humanPoints} vs ${aiPoints}). Gana ${winner === PLAYER ? activeGame.players.humanName : "máquina"} (+${points}).`)
    }

    stopMachineThinking(activeGame)
    checkScoreAfterSideBet(activeGame)
    persistGamesState()
    render()
  }, randomMachineDelay())
}

function humanCallFlorAsTrucoReply(game) {
  const hand = game.currentHand
  const ticket = game.waitingReply
  if (!hand || !ticket) return
  if (!canCallFlorAsTrucoReply(game, hand, PLAYER, ticket)) return

  addLog(game, "¡La flor está primero!")
  addLog(game, `${game.players.humanName} canta Flor (antes de responder el Truco).`)
  hand.flor.status = "pending"
  hand.envido.status = "blocked"
  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return
    const activeHand = activeGame.currentHand

    const aiHas = canCallFlor(activeGame, activeHand, MACHINE)
    if (!aiHas && Math.random() < 0.55) {
      activeGame.scores[PLAYER] += 1
      activeHand.flor = { status: "resolved", winner: PLAYER, points: 1 }
      addLog(activeGame, `Máquina no quiere Flor. ${activeGame.players.humanName} suma 1.`)
    } else {
      const humanValue = calcFlorScore(activeHand.humanHand.concat(getPlayedCards(activeHand, PLAYER)))
      const aiValue = calcFlorScore(activeHand.aiHand.concat(getPlayedCards(activeHand, MACHINE)))
      const winner = humanValue >= aiValue ? PLAYER : MACHINE
      activeGame.scores[winner] += 3
      activeHand.flor = { status: "resolved", winner, points: 3 }
      addLog(activeGame, `Flor jugada (${humanValue} vs ${aiValue}). Gana ${winner === PLAYER ? activeGame.players.humanName : "máquina"} (+3).`)
    }

    stopMachineThinking(activeGame)
    checkScoreAfterSideBet(activeGame)
    persistGamesState()
    render()
  }, randomMachineDelay())
}

function humanCallFlor(game) {
  const hand = game.currentHand
  if (!isHumanTurnReady(game) || hand.resolved) return
  if (!canCallFlor(game, hand, PLAYER)) return

  addLog(game, `${game.players.humanName} canta Flor.`)
  hand.flor.status = "pending"
  hand.envido.status = "blocked"
  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return
    const activeHand = activeGame.currentHand

    const aiHas = canCallFlor(activeGame, activeHand, MACHINE)
    if (!aiHas && Math.random() < 0.55) {
      activeGame.scores[PLAYER] += 1
      activeHand.flor = { status: "resolved", winner: PLAYER, points: 1 }
      addLog(activeGame, `Máquina no quiere Flor. ${activeGame.players.humanName} suma 1.`)
    } else {
      const humanValue = calcFlorScore(activeHand.humanHand.concat(getPlayedCards(activeHand, PLAYER)))
      const aiValue = calcFlorScore(activeHand.aiHand.concat(getPlayedCards(activeHand, MACHINE)))
      const winner = humanValue >= aiValue ? PLAYER : MACHINE
      activeGame.scores[winner] += 3
      activeHand.flor = { status: "resolved", winner, points: 3 }
      addLog(activeGame, `Flor jugada (${humanValue} vs ${aiValue}). Gana ${winner === PLAYER ? activeGame.players.humanName : "máquina"} (+3).`)
    }

    stopMachineThinking(activeGame)
    checkScoreAfterSideBet(activeGame)
    persistGamesState()
    render()
    maybeRunMachineTurn(activeGame)
  }, randomMachineDelay())
}

function resolveHumanReply(game, reply) {
  if (!game.waitingReply) return

  const ticket = game.waitingReply
  game.waitingReply = null

  if (ticket.type === "truco") {
    if (reply === "accept") {
      game.currentHand.trucoAcceptedLevel = ticket.level
      game.currentHand.trucoCanRaiseBy = PLAYER
      addLog(game, `${game.players.humanName} acepta ${TRUCO_NAMES[ticket.level]}.`)
      persistGamesState()
      render()
      maybeRunMachineTurn(game)
      return
    }

    const points = TRUCO_POINTS_BY_LEVEL[ticket.level - 1]
    game.scores[MACHINE] += points
    game.currentHand.resolved = true
    addLog(game, `${game.players.humanName} no quiere ${TRUCO_NAMES[ticket.level]}. Máquina suma ${points}.`)
    const matchWillFinish = game.scores[MACHINE] >= game.targetScore
    game.updatedAt = new Date().toISOString()
    openRoundResultModal(game, {
      handNumber: game.handNumber,
      roundWinner: MACHINE,
      roundPoints: points,
      matchWillFinish,
      matchWinner: matchWillFinish ? MACHINE : null
    })
    persistGamesState()
    render()
    return
  }

  if (ticket.type === "envido") {
    if (reply === "accept") {
      const hand = game.currentHand
      const humanPoints = calcEnvidoScore(hand.humanHand.concat(getPlayedCards(hand, PLAYER)))
      const aiPoints = calcEnvidoScore(hand.aiHand.concat(getPlayedCards(hand, MACHINE)))
      const winner = humanPoints >= aiPoints ? PLAYER : MACHINE
      const points = envidoPoints(ticket.kind, game)
      game.scores[winner] += points
      hand.envido = { status: "resolved", winner, points }
      addLog(game, `${game.players.humanName} acepta ${ticket.label}. Resultado ${humanPoints} vs ${aiPoints}.`)
    } else {
      game.scores[MACHINE] += 1
      game.currentHand.envido = { status: "resolved", winner: MACHINE, points: 1 }
      addLog(game, `${game.players.humanName} no quiere ${ticket.label}. Máquina suma 1.`)
    }

    checkScoreAfterSideBet(game)
    persistGamesState()
    render()
    maybeRunMachineTurn(game)
    return
  }

  if (ticket.type === "flor") {
    const hand = game.currentHand
    if (reply === "accept") {
      const humanValue = calcFlorScore(hand.humanHand.concat(getPlayedCards(hand, PLAYER)))
      const aiValue = calcFlorScore(hand.aiHand.concat(getPlayedCards(hand, MACHINE)))
      const winner = humanValue >= aiValue ? PLAYER : MACHINE
      game.scores[winner] += 3
      hand.flor = { status: "resolved", winner, points: 3 }
      addLog(game, `Flor aceptada (${humanValue} vs ${aiValue}).`)
    } else {
      game.scores[MACHINE] += 1
      hand.flor = { status: "resolved", winner: MACHINE, points: 1 }
      addLog(game, `${game.players.humanName} no quiere Flor. Máquina suma 1.`)
    }

    checkScoreAfterSideBet(game)
    persistGamesState()
    render()
    if (game.status !== "in_progress") return
    if (game.pendingMachineTrucoReply) {
      resolvePendingMachineTrucoReply(game)
      return
    }
    maybeRunMachineTurn(game)
  }
}

function resolvePendingMachineTrucoReply(game) {
  const pending = game.pendingMachineTrucoReply
  if (!pending || game.status !== "in_progress") return
  game.pendingMachineTrucoReply = null

  const hand = game.currentHand
  if (!hand || hand.resolved) {
    persistGamesState()
    render()
    return
  }

  const aiAccepts = machineAcceptTruco(hand, pending.level)
  if (aiAccepts) {
    hand.trucoAcceptedLevel = pending.level
    hand.trucoCanRaiseBy = MACHINE
    addLog(game, `Máquina acepta ${TRUCO_NAMES[pending.level]}.`)
    persistGamesState()
    render()
    maybeRunMachineTurn(game)
    return
  }

  const points = TRUCO_POINTS_BY_LEVEL[pending.level - 1]
  game.scores[PLAYER] += points
  hand.resolved = true
  addLog(game, `Máquina no quiere ${TRUCO_NAMES[pending.level]}. ${game.players.humanName} suma ${points}.`)
  const matchWillFinish = game.scores[PLAYER] >= game.targetScore
  game.updatedAt = new Date().toISOString()
  openRoundResultModal(game, {
    handNumber: game.handNumber,
    roundWinner: PLAYER,
    roundPoints: points,
    matchWillFinish,
    matchWinner: matchWillFinish ? PLAYER : null
  })
  persistGamesState()
  render()
}

function maybeRunMachineTurn(game) {
  if (!game || game.status !== "in_progress") return

  const hand = game.currentHand
  if (!hand || hand.resolved) return
  if (game.waitingReply || game.machineThinking || hand.turn !== MACHINE) return

  startMachineThinking(game)
  persistGamesState()
  render()

  setTimeout(() => {
    const activeGame = findGameById(game.id)
    if (!activeGame || activeGame.status !== "in_progress") return

    const activeHand = activeGame.currentHand
    if (activeHand.resolved || activeHand.turn !== MACHINE) {
      stopMachineThinking(activeGame)
      persistGamesState()
      render()
      return
    }

    if (canMachineCallFlor(activeGame, activeHand)) {
      activeGame.waitingReply = {
        type: "flor",
        label: "Flor",
        options: ["accept", "reject"]
      }
      activeHand.flor.status = "pending"
      activeHand.envido.status = "blocked"
      addLog(activeGame, "Máquina canta Flor.")
      stopMachineThinking(activeGame)
      persistGamesState()
      render()
      return
    }

    const machineEnvidoKind = chooseMachineEnvidoCall(activeGame, activeHand)
    if (machineEnvidoKind) {
      const kind = machineEnvidoKind
      const label = kind === "envido" ? "Envido" : kind === "real_envido" ? "Real Envido" : "Falta Envido"
      activeGame.waitingReply = {
        type: "envido",
        kind,
        label,
        options: ["accept", "reject"]
      }
      activeHand.envido.status = "pending"
      if (isEnvidoPrimeroCase(activeHand, MACHINE)) {
        addLog(activeGame, "¡El envido está primero!")
      }
      addLog(activeGame, `Máquina canta ${label}.`)
      stopMachineThinking(activeGame)
      persistGamesState()
      render()
      return
    }

    if (canMachineCallTruco(activeHand)) {
      activeHand.trucoLevel += 1
      const level = activeHand.trucoLevel
      activeGame.waitingReply = {
        type: "truco",
        level,
        by: MACHINE,
        options: ["accept", "reject"]
      }
      addLog(activeGame, `Máquina canta ${TRUCO_NAMES[level]}.`)
      stopMachineThinking(activeGame)
      persistGamesState()
      render()
      return
    }

    stopMachineThinking(activeGame)
    playMachineCard(activeGame)
    persistGamesState()
    render()
  }, randomMachineDelay())
}

function canMachineCallTruco(hand) {
  if (hand.table.length > 0) return false
  if (!canPlayerCallTruco(hand, MACHINE)) return false

  const power = hand.aiHand.reduce((sum, card) => sum + cardStrength(card), 0) / Math.max(1, hand.aiHand.length)
  const chance = power > 8.4 ? 0.48 : power > 6.8 ? 0.28 : 0.08
  return Math.random() < chance
}

function canPlayerCallTruco(hand, player) {
  if (hand.trucoLevel >= 3) return false
  if (hand.trucoLevel === 0) return true
  if (hand.trucoAcceptedLevel !== hand.trucoLevel) return false
  return hand.trucoCanRaiseBy === player
}

function chooseMachineEnvidoCall(game, hand) {
  if (!canCallEnvidoByPlayer(game, hand, MACHINE)) return null

  const aiPoints = calcEnvidoScore(hand.aiHand.concat(getPlayedCards(hand, MACHINE)))
  const policy = getMachineEnvidoPolicy(aiPoints)

  if (Math.random() < (policy.call.falta_envido ?? 0)) return "falta_envido"
  if (Math.random() < (policy.call.real_envido ?? 0)) return "real_envido"
  if (Math.random() < (policy.call.envido ?? 0)) return "envido"
  return null
}

function canMachineCallFlor(game, hand) {
  if (game.mode !== MODE_TRUCO_ENVIDO_FLOR) return false
  return hand.flor.status === "available" && hand.table.length === 0 && hasFlor(hand.aiHand)
}

function hasPlayerPlayedCardInHand(hand, player) {
  if (hand.table.some((play) => play.player === player)) return true
  return hand.trickHistory.some((trick) => trick.plays.some((play) => play.player === player))
}

function isEnvidoPrimeroCase(hand, player) {
  return (
    hand.table.length === 1 &&
    hand.table[0]?.player !== player &&
    !hasPlayerPlayedCardInHand(hand, player)
  )
}

function shouldLogEnvidoPrimero(hand, player, ticket = null) {
  if (!hand) return false
  if (isEnvidoPrimeroCase(hand, player)) return true
  return (
    ticket?.type === "truco" &&
    ticket?.level === 1 &&
    hand.table.length === 0 &&
    hand.trickHistory.length === 0 &&
    !hasPlayerPlayedCardInHand(hand, player)
  )
}

function canCallEnvidoByPlayer(game, hand, player) {
  if (!game || !hand) return false
  if (hand.envido.status !== "available") return false
  if (hand.trucoAcceptedLevel !== 0) return false
  if (hand.trickHistory.length > 0) return false
  if (hasPlayerPlayedCardInHand(hand, player)) return false
  if (hand.table.length === 0) return true
  return hand.table.length === 1 && hand.table[0]?.player !== player
}

function canCallEnvidoAsTrucoReply(hand, ticket) {
  return (
    hand.envido.status === "available" &&
    hand.table.length === 0 &&
    hand.trickHistory.length === 0 &&
    ticket?.type === "truco" &&
    ticket?.level === 1
  )
}

function canCallFlorAsTrucoReply(game, hand, player, ticket) {
  if (!game || !hand) return false
  if (game.mode !== MODE_TRUCO_ENVIDO_FLOR) return false
  if (ticket?.type !== "truco" || ticket?.level !== 1) return false
  if (hand.flor.status !== "available") return false
  if (hand.trickHistory.length > 0) return false
  if (hasPlayerPlayedCardInHand(hand, player)) return false

  const cards = player === PLAYER ? hand.humanHand : hand.aiHand
  if (!hasFlor(cards)) return false
  if (hand.table.length === 0) return true
  return hand.table.length === 1 && hand.table[0]?.player !== player
}

function canCallFlor(game, hand, player) {
  if (game.mode !== MODE_TRUCO_ENVIDO_FLOR) return false
  if (hand.flor.status !== "available" || hand.table.length > 0) return false
  const cards = player === PLAYER ? hand.humanHand : hand.aiHand
  return hasFlor(cards)
}

function isHumanTurnReady(game) {
  if (!game || game.status !== "in_progress") return false
  const hand = game.currentHand
  return !game.machineThinking && !game.waitingReply && hand.turn === PLAYER && !hand.resolved
}

function hasFlor(cards) {
  const bySuit = groupBySuit(cards)
  return Object.values(bySuit).some((arr) => arr.length === 3)
}

function calcFlorScore(cards) {
  const grouped = groupBySuit(cards)
  let best = 0
  for (const suitCards of Object.values(grouped)) {
    if (suitCards.length < 3) continue
    const values = suitCards.map(envidoCardValue)
    const total = 20 + values[0] + values[1] + values[2]
    if (total > best) best = total
  }
  return best
}

function calcEnvidoScore(cards) {
  const grouped = groupBySuit(cards)
  let best = 0

  for (const suitCards of Object.values(grouped)) {
    if (suitCards.length >= 2) {
      const values = suitCards.map(envidoCardValue).sort((a, b) => b - a)
      best = Math.max(best, 20 + values[0] + values[1])
    } else if (suitCards.length === 1) {
      best = Math.max(best, envidoCardValue(suitCards[0]))
    }
  }

  return best
}

function groupBySuit(cards) {
  return cards.reduce((acc, card) => {
    if (!acc[card.suit]) acc[card.suit] = []
    acc[card.suit].push(card)
    return acc
  }, {})
}

function envidoCardValue(card) {
  return card.value >= 10 ? 0 : card.value
}

function envidoPoints(kind, game) {
  if (kind === "falta_envido") {
    return Math.max(game.targetScore - game.scores[PLAYER], game.targetScore - game.scores[MACHINE])
  }
  if (kind === "real_envido") return 3
  return 2
}

function getPlayedCards(hand, player) {
  return hand.trickHistory
    .flatMap((trick) => trick.plays)
    .filter((play) => play.player === player)
    .map((play) => play.card)
}

function checkScoreAfterSideBet(game) {
  if (game.scores[PLAYER] >= game.targetScore) {
    finishGame(game, PLAYER)
  } else if (game.scores[MACHINE] >= game.targetScore) {
    finishGame(game, MACHINE)
  }
}

function cardStrength(card) {
  if (card.value === 1 && card.suit === "ESPADA") return 140
  if (card.value === 1 && card.suit === "BASTO") return 139
  if (card.value === 7 && card.suit === "ESPADA") return 138
  if (card.value === 7 && card.suit === "ORO") return 137

  if (card.value === 3) return 130
  if (card.value === 2) return 129
  if (card.value === 1) return 128
  if (card.value === 12) return 127
  if (card.value === 11) return 126
  if (card.value === 10) return 125
  if (card.value === 7) return 124
  if (card.value === 6) return 123
  if (card.value === 5) return 122
  if (card.value === 4) return 121
  return 0
}

function labelCard(card) {
  return `${card.value} de ${card.suit}`
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function randomMachineDelay() {
  return Math.floor(Math.random() * 2001) + 4000
}

function startMachineThinking(game) {
  game.machineThinking = true
  game.machineThinkingMessage = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]
}

function stopMachineThinking(game) {
  game.machineThinking = false
  game.machineThinkingMessage = ""
}

function addLog(game, message) {
  if (!game) return
  game.log.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    message
  })
  game.log = game.log.slice(0, 40)
  game.updatedAt = new Date().toISOString()
  addGameToast(message)
}

function persistGamesState() {
  saveToStorage(STORAGE_KEYS.GAMES_IN_PROGRESS, state.gamesInProgress)
  saveToStorage(STORAGE_KEYS.FINISHED_GAMES, state.finishedGames)
  removeFromStorage(STORAGE_KEYS.CURRENT_GAME_ID)

  const activeGame = findGameById(state.currentGameId)
  if (activeGame?.status === "in_progress") {
    saveToSessionStorage(SESSION_STORAGE_KEYS.CURRENT_GAME_ID, state.currentGameId)
    saveToSessionStorage(SESSION_STORAGE_KEYS.ACTIVE_GAME, activeGame)
  } else {
    removeFromSessionStorage(SESSION_STORAGE_KEYS.CURRENT_GAME_ID)
    removeFromSessionStorage(SESSION_STORAGE_KEYS.ACTIVE_GAME)
  }
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore storage cleanup failures
  }
}

function loadFromSessionStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveToSessionStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

function removeFromSessionStorage(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore storage cleanup failures
  }
}

function dealHands(game, mano) {
  refillDrawPileIfNeeded(game)
  const humanHand = []
  const aiHand = []

  for (let i = 0; i < 3; i += 1) {
    const first = game.drawPile.shift()
    const second = game.drawPile.shift()
    if (mano === PLAYER) {
      humanHand.push(first)
      aiHand.push(second)
    } else {
      aiHand.push(first)
      humanHand.push(second)
    }
  }

  return { humanHand, aiHand }
}

function refillDrawPileIfNeeded(game) {
  if (!Array.isArray(game.drawPile)) {
    game.drawPile = []
  }
  if (game.drawPile.length >= 6) return

  let nextPile = shuffle([...state.cards])
  if (Array.isArray(game.lastHandCardIds) && game.lastHandCardIds.length) {
    const lastSet = new Set(game.lastHandCardIds.map(String))
    const preferred = nextPile.filter((card) => !lastSet.has(String(card.id)))
    const fallback = nextPile.filter((card) => lastSet.has(String(card.id)))
    nextPile = preferred.concat(fallback)
  }
  game.drawPile = nextPile
}

function getNextTurnAfterTrick(hand, trickWinner, completedTrickNumber) {
  if (trickWinner) return trickWinner
  if (completedTrickNumber === 1 || completedTrickNumber === 2) {
    return hand.mano
  }
  return hand.mano
}

function findGameById(id) {
  if (!id) return null
  return state.gamesInProgress.find((game) => String(game.id) === String(id)) || null
}

function getCurrentGame() {
  return findGameById(state.currentGameId)
}

function formatModeLabel(mode) {
  return mode === MODE_TRUCO_ENVIDO ? "Truco + Envido" : "Truco + Envido + Flor"
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString("es-AR")
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
}

function getFinishedTotalPages() {
  return Math.max(1, Math.ceil(state.finishedGames.length / state.homePagination.pageSize))
}

function clampFinishedPage() {
  const totalPages = getFinishedTotalPages()
  state.homePagination.finishedPage = Math.min(state.homePagination.finishedPage, totalPages - 1)
  state.homePagination.finishedPage = Math.max(0, state.homePagination.finishedPage)
}

function renderMessage(text) {
  app.innerHTML = `
    <div class="pixel-message-wrap">
      <div class="pixel-message-card px-panel px-panel--modal">
        <div class="pixel-message-header">
          <h1 class="pixel-message-title">TRUCO ARGENTINO</h1>
        </div>
        <p class="pixel-message-text">${text}</p>
      </div>
    </div>
  `
}

function render() {
  clampFinishedPage()

  if (state.loadingCards) {
    renderMessage("Cargando cartas...")
    return
  }

  if (state.cardsError) {
    renderMessage(`Error al consumir API: ${state.cardsError}`)
    return
  }

  const currentGame = getCurrentGame()
  if (state.view === "game" && currentGame?.status === "in_progress") {
    renderGameView(currentGame)
  } else {
    renderHomeView()
  }
}

function renderHomeView() {
  const modeCards = [
    {
      mode: MODE_TRUCO_ENVIDO,
      title: "Truco + Envido",
      subtitle: "Modo sin Flor",
      accentClass: "mode-card-te"
    },
    {
      mode: MODE_TRUCO_ENVIDO_FLOR,
      title: "Truco + Envido + Flor",
      subtitle: "Modo completo",
      accentClass: "mode-card-tef"
    }
  ]

  const modeSections = modeCards
    .map((card) => {
      const hasModeGame = state.gamesInProgress.some((game) => game.mode === card.mode)
      return `
        <article class="mode-card px-panel px-panel--home ${card.accentClass}">
          <h2 class="mode-title">${card.title} <span class="mode-title-note">(${card.subtitle})</span></h2>
          <div class="mode-actions">
            <button data-action="open-create-game-modal" data-mode="${card.mode}" class="px-btn px-btn--primary">Nueva partida</button>
            <button data-action="resume-mode" data-mode="${card.mode}" class="px-btn px-btn--secondary" ${hasModeGame ? "" : "disabled"}>Reanudar</button>
          </div>
        </article>
      `
    })
    .join("")

  const inProgressRows = state.gamesInProgress
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((game) => {
      const humanName = escapeHtml(game.players.humanName)
      const machineName = escapeHtml(game.players.machineName)
      return `
        <li class="list-row">
          <div class="list-row-text">
            <p class="list-row-title">${humanName} vs ${machineName}</p>
            <p class="list-row-sub">${formatModeLabel(game.mode)} · ${formatDate(game.updatedAt)} · ${game.scores[PLAYER]}-${game.scores[MACHINE]}</p>
          </div>
          <div class="row-actions">
            <button data-action="join-game" data-game-id="${game.id}" class="px-btn px-btn--primary px-btn--sm">Unirse</button>
            <button data-action="request-close-draw" data-game-id="${game.id}" class="px-btn px-btn--danger px-btn--sm">Cerrar</button>
          </div>
        </li>
      `
    })
    .join("")

  const startIndex = state.homePagination.finishedPage * state.homePagination.pageSize
  const visibleFinished = state.finishedGames.slice(startIndex, startIndex + state.homePagination.pageSize)
  const finishedRows = visibleFinished
    .map((match) => {
      const humanName = escapeHtml(match.players.humanName)
      const machineName = escapeHtml(match.players.machineName)
      return `
        <li class="list-row">
          <div class="list-row-text">
            <p class="list-row-title">${humanName} ${match.scores[PLAYER]} - ${machineName} ${match.scores[MACHINE]}</p>
          </div>
        </li>
      `
    })
    .join("")

  const totalPages = getFinishedTotalPages()
  const isFirstPage = state.homePagination.finishedPage <= 0
  const isLastPage = state.homePagination.finishedPage >= totalPages - 1
  const drawModalGame = findGameById(state.confirmDrawGameId)
  const drawModalBody = drawModalGame
    ? `Vas a cerrar la partida de ${escapeHtml(drawModalGame.players.humanName)} contra Máquina. Se guardará como empate.`
    : "Vas a cerrar esta partida y se guardará como empate."
  const createGameModeLabel = state.createGameModal.mode ? formatModeLabel(state.createGameModal.mode) : ""
  const createModalDraftName = escapeHtml(state.createGameModal.draftName || "")
  const createModalError = state.createGameModal.error ? `<p class="modal-form-error">${escapeHtml(state.createGameModal.error)}</p>` : ""

  app.innerHTML = `
    <main class="landing-wrap tw:w-full tw:h-screen">
      <section class="landing-shell tw:w-full tw:h-full">
        <header class="landing-header">
          <div class="landing-banner">
            <div class="landing-banner-copy">
              <h1 class="landing-title">TRUCO ARGENTINO</h1>
            </div>
            <div class="lang-toggle-group">
              <button class="lang-btn lang-btn--selected" disabled>Español</button>
              <button class="lang-btn lang-btn--unselected" data-action="try-english">English</button>
            </div>
          </div>
        </header>

        <section class="modes-grid">
          ${modeSections}
        </section>

        <section class="lists-grid">
          <article class="list-card px-panel px-panel--list">
            <h2 class="list-title">Partidas en curso (${state.gamesInProgress.length}/${MAX_IN_PROGRESS_GAMES})</h2>
            <ul class="list-body list-body-scroll">
              ${inProgressRows || '<li class="empty-row">No hay partidas en curso.</li>'}
            </ul>
          </article>

          <article class="list-card px-panel px-panel--list">
            <h2 class="list-title">Partidas finalizadas</h2>
            <ul class="list-body">
              ${finishedRows || '<li class="empty-row">Todavía no hay partidas finalizadas.</li>'}
            </ul>
            <div class="pagination-row">
              <button data-action="finished-prev" class="px-btn px-btn--secondary" ${isFirstPage ? "disabled" : ""}>Previo</button>
              <span class="page-indicator">Página ${state.homePagination.finishedPage + 1} de ${totalPages}</span>
              <button data-action="finished-next" class="px-btn px-btn--secondary" ${isLastPage ? "disabled" : ""}>Siguiente</button>
            </div>
          </article>
        </section>
      </section>
      ${state.homeNotice ? `<div class="px-toast" role="status" data-action="dismiss-home-notice">${escapeHtml(state.homeNotice)}</div>` : ""}
      ${
        state.langModal.open
          ? `
            <div class="modal-overlay" data-action="close-lang-modal">
              <div class="modal-card px-panel px-panel--modal" data-action="modal-panel" role="dialog" aria-modal="true" aria-label="Acción prohibida">
                <h3 class="modal-title">Acción prohibida</h3>
                <p class="modal-text">Ningun "Afternoon" ni ningún "Hello", aquí tu hablas ESPAÑOL.</p>
                <div class="modal-actions">
                  <button data-action="close-lang-modal" class="px-btn px-btn--primary">Aceptar</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
      ${
        state.confirmDrawGameId
          ? `
            <div class="modal-overlay" data-action="cancel-close-draw">
              <div class="modal-card px-panel px-panel--modal" data-action="modal-panel" role="dialog" aria-modal="true" aria-label="Confirmar empate">
                <h3 class="modal-title">Confirmar cierre en empate</h3>
                <p class="modal-text">${drawModalBody}</p>
                <div class="modal-actions">
                  <button data-action="confirm-close-draw" data-game-id="${state.confirmDrawGameId}" class="px-btn px-btn--danger">Confirmar empate</button>
                  <button data-action="cancel-close-draw" class="px-btn px-btn--secondary">Cancelar</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
      ${
        state.createGameModal.open
          ? `
            <div class="modal-overlay" data-action="cancel-create-game">
              <div class="modal-card px-panel px-panel--modal" data-action="modal-panel" role="dialog" aria-modal="true" aria-label="Nombre del jugador">
                <h3 class="modal-title">Nueva partida (${createGameModeLabel})</h3>
                <p class="modal-text">Ingresá el nombre del jugador para comenzar.</p>
                <label class="modal-form-label" for="create-game-name">Nombre jugador</label>
                <input id="create-game-name" data-action="set-create-name" value="${createModalDraftName}" class="modal-form-input" type="text" placeholder="Ej: Martín" autocomplete="nickname" />
                ${createModalError}
                <div class="modal-actions">
                  <button data-action="confirm-create-game" class="px-btn px-btn--primary">Aceptar</button>
                  <button data-action="cancel-create-game" class="px-btn px-btn--secondary">Cancelar</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
      ${
        state.pendingCreation
          ? `
            <div class="modal-overlay" data-action="dismiss-limit-warning">
              <div class="modal-card px-panel px-panel--modal" data-action="modal-panel" role="dialog" aria-modal="true" aria-label="Límite de partidas en curso">
                <h3 class="modal-title">Límite alcanzado</h3>
                <p class="modal-text">Ya hay ${MAX_IN_PROGRESS_GAMES} partidas en curso. Debés cerrar una para crear otra.</p>
                <div class="modal-actions">
                  <button data-action="confirm-close-oldest-and-create" class="px-btn px-btn--danger">Cerrar la más antigua y crear</button>
                  <button data-action="dismiss-limit-warning" class="px-btn px-btn--secondary">Cancelar</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
    </main>
  `

  if (state.createGameModal.open) {
    const input = app.querySelector("#create-game-name")
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }
}

function renderGameView(game) {
  const hand = game.currentHand
  const reply = game.waitingReply
  const roundResultModal = isRoundResultModalOpenForGame(game.id) ? state.roundResultModal : null
  const roundModalOpen = Boolean(roundResultModal)
  const canAct = isHumanTurnReady(game) && !roundModalOpen
  const hasReply = Boolean(reply) && !roundModalOpen
  const canReplyRaiseEnvido = !roundModalOpen && reply?.type === "truco" && canCallEnvidoAsTrucoReply(hand, reply)
  const canReplyFlor = !roundModalOpen && reply?.type === "truco" && canCallFlorAsTrucoReply(game, hand, PLAYER, reply)
  const handLabel = TRUCO_NAMES[hand.trucoAcceptedLevel]
  const nextTrucoLevel = Math.min(hand.trucoLevel + 1, 3)
  const trucoButtonLabel = TRUCO_NAMES[nextTrucoLevel] || "Truco"
  const showFlorAction = game.mode === MODE_TRUCO_ENVIDO_FLOR
  const humanName = escapeHtml(game.players.humanName)

  const raiseOwner =
    hand.trucoCanRaiseBy === PLAYER ? humanName : hand.trucoCanRaiseBy === MACHINE ? "Máquina" : "Nadie"

  const aiCards = hand.aiHand
    .map(() => `<img src="assets/cards/individual/card_back.png" alt="Carta máquina" class="card-img card-img-game" />`)
    .join("")

  const humanCards = hand.humanHand
    .map(
      (card) => `
      <button data-action="play-card" data-card-id="${card.id}" class="card-btn" ${roundModalOpen ? "disabled" : ""}>
        <img src="${card.image}" alt="${labelCard(card)}" class="card-img card-img-game" />
      </button>
    `
    )
    .join("")

  const allPlayedCards = hand.trickHistory.flatMap((trick) => trick.plays).concat(hand.table)
  const humanPlayed = allPlayedCards.filter((play) => play.player === PLAYER).map((play) => play.card)
  const machinePlayed = allPlayedCards.filter((play) => play.player === MACHINE).map((play) => play.card)

  const renderPileStack = (cards, player) => {
    if (!cards.length) return '<p class="pile-empty">Sin cartas jugadas</p>'

    const previewCards = cards.slice(Math.max(0, cards.length - 3))
    const stack = previewCards
      .map((card, index) => {
        const shift = index * 10
        return `<img src="${card.image}" alt="${labelCard(card)}" class="card-img card-img-game stack-card" style="left:${shift}px; top:${index * 3}px;" />`
      })
      .join("")

    const detailVisible = hand.openPile === player
    const detail = detailVisible
      ? `<div class="pile-detail">${cards
          .map((card) => `<img src="${card.image}" alt="${labelCard(card)}" class="card-img card-img-game" />`)
          .join("")}</div>`
      : ""

    return `
      <button data-action="toggle-pile" data-player="${player}" class="pile-button">
        <div class="pile-stack">${stack}</div>
      </button>
      ${detail}
    `
  }

  const replyStatusText = hasReply
    ? `Canto pendiente de máquina: ${reply.type === "truco" ? TRUCO_NAMES[reply.level] : reply.label || "Respuesta"}`
    : "Sin canto pendiente para responder."
  const roundWinnerName =
    roundResultModal?.roundWinner === PLAYER
      ? roundResultModal.humanName
      : roundResultModal?.roundWinner === MACHINE
        ? roundResultModal.machineName
        : "Nadie"

  app.innerHTML = `
    <main class="game-screen tw:w-full tw:h-screen">
      <div class="game-topbar">
        <span class="game-topbar-player">${humanName} vs Máquina</span>
      </div>
      <section class="game-layout">
        <aside class="game-status-panel px-panel px-panel--game">
          <h2 class="status-title">Partida</h2>
          <div class="status-row turn-row">
            <span class="status-label">Turno</span>
            <strong class="status-value">${hand.turn === PLAYER ? humanName : "Máquina"}</strong>
          </div>
          <div class="status-row">
            <span class="status-label">Puntaje</span>
            <strong class="status-value">${game.scores[PLAYER]} - ${game.scores[MACHINE]}</strong>
          </div>
          <div class="status-row">
            <span class="status-label">Modo</span>
            <strong class="status-value">${formatModeLabel(game.mode)}</strong>
          </div>
          <div class="status-row">
            <span class="status-label">Estado de Truco</span>
            <strong class="status-value">${handLabel}</strong>
          </div>
          <div class="status-row">
            <span class="status-label">Mano</span>
            <strong class="status-value">${game.handNumber}</strong>
            </div>
          <div class="status-row">
            <span class="status-label">Tiene el quiero</span>
            <strong class="status-value">${raiseOwner}</strong>
          </div>
          <div class="status-footer">
            <button data-action="go-home" class="px-btn px-btn--secondary px-btn--sm status-back-btn">Volver</button>
          </div>
        </aside>

        <section class="game-board">
          <div>
            <p class="zone-title">Máquina</p>
            <div class="opponent-zone-wrap">
              ${
                game.machineThinking
                  ? `<p class="thinking-bubble">${game.machineThinkingMessage || "Pensando próxima jugada..."}</p>`
                  : ""
              }
              <div class="opponent-zone">${aiCards || '<p class="zone-empty">Sin cartas.</p>'}</div>
            </div>
          </div>

          <div class="table-center">
            <div class="table-flat">
              <p class="zone-title">Mesa de juego</p>
              <div class="table-common">
                <div class="table-common-row">
                  <div class="pile-box">
                    <p class="pile-label">Pila Máquina</p>
                    ${renderPileStack(machinePlayed, MACHINE)}
                  </div>
                  <div class="pile-box">
                    <p class="pile-label">Pila Jugador</p>
                    ${renderPileStack(humanPlayed, PLAYER)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="player-zone">${humanCards || '<p class="zone-empty">Sin cartas.</p>'}</div>
            <p class="zone-title player-label">${humanName}</p>
          </div>
        </section>

        <aside class="game-actions-panel">
          <h2 class="actions-title">Acciones</h2>
          <div class="action-grid">
            <button data-action="call-truco" ${!canAct || !canPlayerCallTruco(hand, PLAYER) ? "disabled" : ""} class="px-btn px-btn--primary px-btn--action chant-btn">${trucoButtonLabel}</button>
            <button data-action="call-envido" ${!canAct || !canCallEnvidoByPlayer(game, hand, PLAYER) ? "disabled" : ""} class="px-btn px-btn--secondary px-btn--action chant-btn">Envido</button>
            <button data-action="call-real-envido" ${!canAct || !canCallEnvidoByPlayer(game, hand, PLAYER) ? "disabled" : ""} class="px-btn px-btn--warning px-btn--action chant-btn">Real Envido</button>
            <button data-action="call-falta-envido" ${!canAct || !canCallEnvidoByPlayer(game, hand, PLAYER) ? "disabled" : ""} class="px-btn px-btn--danger px-btn--action chant-btn">Falta Envido</button>
            ${
              showFlorAction
                ? `<button data-action="call-flor" ${!canAct || !canCallFlor(game, hand, PLAYER) ? "disabled" : ""} class="px-btn px-btn--special px-btn--action chant-btn action-span-2">Flor</button>`
                : ""
            }
            <button data-action="go-to-mazo" ${!canAct ? "disabled" : ""} class="px-btn px-btn--danger px-btn--action action-span-2">Irse al mazo</button>
          </div>
          <div class="actions-separator" aria-hidden="true"></div>
          <p class="hint-msg">Jugá una carta o cantá.</p>

          <div class="actions-separator" aria-hidden="true"></div>

          <div class="reply-box px-panel px-panel--game">
            <h3 class="reply-title">Responder canto</h3>
            <p class="reply-text">${replyStatusText}</p>
            <div class="action-grid action-grid--responses">
              <button data-action="reply-call" data-reply="accept" class="px-btn px-btn--success px-btn--action" ${hasReply ? "" : "disabled"}>Quiero</button>
              <button data-action="reply-call" data-reply="reject" class="px-btn px-btn--danger px-btn--action" ${hasReply ? "" : "disabled"}>No quiero</button>
              <button data-action="reply-envido" data-kind="envido" class="px-btn px-btn--secondary px-btn--action" ${canReplyRaiseEnvido ? "" : "disabled"}>Envido</button>
              <button data-action="reply-envido" data-kind="real_envido" class="px-btn px-btn--warning px-btn--action" ${canReplyRaiseEnvido ? "" : "disabled"}>Real Envido</button>
              <button data-action="reply-envido" data-kind="falta_envido" class="px-btn px-btn--danger px-btn--action" ${canReplyRaiseEnvido ? "" : "disabled"}>Falta Envido</button>
              <button data-action="reply-flor" class="px-btn px-btn--special px-btn--action" ${showFlorAction && canReplyFlor ? "" : "disabled"}>Flor</button>
            </div>
          </div>
        </aside>
      </section>
      ${
        roundModalOpen
          ? `
            <div class="modal-overlay" data-action="round-result-overlay">
              <div class="modal-card px-panel px-panel--modal round-result-modal" data-action="round-result-panel" role="dialog" aria-modal="true" aria-label="Resultado de la mano">
                <h3 class="modal-title">Resultado de la mano ${roundResultModal.handNumber}</h3>
                <p class="modal-text round-result-text">Gana <strong>${escapeHtml(roundWinnerName)}</strong> y suma <strong>${roundResultModal.roundPoints}</strong> punto${roundResultModal.roundPoints === 1 ? "" : "s"}.</p>
                <div class="round-result-scoreboard">
                  <p class="round-result-score-label">Marcador general</p>
                  <p class="round-result-score-line">${escapeHtml(roundResultModal.humanName)} ${roundResultModal.scoreHuman} - ${roundResultModal.scoreMachine} ${escapeHtml(roundResultModal.machineName)}</p>
                </div>
                <div class="modal-actions">
                  <button data-action="continue-round-result" class="px-btn px-btn--primary">Continuar</button>
                </div>
              </div>
            </div>
          `
          : ""
      }
    </main>
  `
}

function togglePileDetail(game, player) {
  if (!game || game.status !== "in_progress" || !game.currentHand) return
  game.currentHand.openPile = game.currentHand.openPile === player ? null : player
  game.updatedAt = new Date().toISOString()
  persistGamesState()
  render()
}
