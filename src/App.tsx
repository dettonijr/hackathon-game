import { matchesPattern } from "@babel/types"
import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

const GRID_SIZE_X = 10
const GRID_SIZE_Y = 7

type GridCell = "O" | "X" | "." | "P"

interface Position {
  row: number
  col: number
  facing: MovementDirection
}

type Map = GridCell[][]

interface State {
  map: Map
  playerPosition: Position
}

enum MovementDirection {
  up = "up",
  down = "down",
  left = "left",
  right = "right",
}

enum PossibleMoves {
  ahead = "ahead",
  turnLeft = "turnLeft",
  turnRight = "turnRight",
}

const checkOutside = (position: Position): boolean => {
  const { row, col } = position
  return row < 0 || row >= GRID_SIZE_Y || col < 0 || col >= GRID_SIZE_X
}

const checkCollision = (position: Position, state: State): boolean => {
  const { row, col } = position
  return state.map[row][col] === "O"
}

const getNewPosition = (playerPosition: Position): Position => {
  const { row, col, facing } = playerPosition

  switch (facing) {
    case MovementDirection.up:
      return { row: row - 1, col, facing: MovementDirection.up }
    case MovementDirection.down:
      return { row: row + 1, col, facing: MovementDirection.down }
    case MovementDirection.left:
      return { row, col: col - 1, facing: MovementDirection.left }
    case MovementDirection.right:
      return { row, col: col + 1, facing: MovementDirection.right }
    default:
      return { row, col, facing: MovementDirection.up }
  }
}

const getFullRow = (map: Map, row: number): GridCell[] => {
  return map[row]
}

const getFullColumn = (map: Map, col: number): GridCell[] => {
  return map.map((row) => row[col])
}

const playerVision = (state: State): GridCell[] => {
  const { playerPosition, map } = state
  const { row, col, facing } = playerPosition

  switch (facing) {
    case MovementDirection.right:
      return getFullRow(map, row).slice(col + 1, GRID_SIZE_X)
    case MovementDirection.left:
      return getFullRow(map, row).slice(0, col).reverse()
    case MovementDirection.up:
      return getFullColumn(map, col).slice(0, row).reverse()
    case MovementDirection.down:
      return getFullColumn(map, col).slice(row + 1, GRID_SIZE_Y)
    default:
      return []
  }
}

const moveAhead = (state: State): State => {
  const { playerPosition } = state
  const newPos = getNewPosition(playerPosition)

  if (checkOutside(newPos)) return state
  if (checkCollision(newPos, state)) return state

  const newState = { ...state }

  newState.playerPosition = { row: newPos.row, col: newPos.col, facing: newPos.facing }

  return newState
}

const turnLeft = (state: State): State => {
  const { playerPosition } = state
  const { facing } = playerPosition

  const newState = { ...state }

  switch (facing) {
    case MovementDirection.up:
      newState.playerPosition.facing = MovementDirection.left
      break
    case MovementDirection.down:
      newState.playerPosition.facing = MovementDirection.right
      break
    case MovementDirection.left:
      newState.playerPosition.facing = MovementDirection.down
      break
    case MovementDirection.right:
      newState.playerPosition.facing = MovementDirection.up
      break
    default:
      break
  }

  return newState
}

const turnRight = (state: State): State => {
  const { playerPosition } = state
  const { facing } = playerPosition

  const newState = { ...state }

  newState.playerPosition.facing = reverseDirection(facing)
  return newState
}

const transition = (state: State, move: PossibleMoves) => {
  const { playerPosition } = state

  switch (move) {
    case PossibleMoves.ahead:
      return moveAhead(state)
    case PossibleMoves.turnLeft:
      return turnLeft(state)
    case PossibleMoves.turnRight:
      return turnRight(state)
    default:
      return state
  }
}

const randomDirection = (): MovementDirection => {
  const directions = [MovementDirection.up, MovementDirection.down, MovementDirection.left, MovementDirection.right]
  const randomIndex = Math.floor(Math.random() * directions.length)
  return directions[randomIndex]
}

const generateRandomPosition = (): Position => {
  const row = Math.floor(Math.random() * GRID_SIZE_Y)
  const col = Math.floor(Math.random() * GRID_SIZE_X)
  return { row, col, facing: randomDirection() }
}

const generateMap = (): Map => {
  const map = Array(GRID_SIZE_Y)
    .fill(null)
    .map(() => Array(GRID_SIZE_X).fill("."))

  for (var i = 0; i < 10; i++) {
    const randomPosition = generateRandomPosition()
    map[randomPosition.row][randomPosition.col] = "O"
  }

  const prizePosition = generateRandomPosition()
  map[prizePosition.row][prizePosition.col] = "X"

  return map
}

const checkWin = (state: State): boolean => {
  const { playerPosition, map } = state
  return map[playerPosition.row][playerPosition.col] === "X"
}

const reverseDirection = (direction: MovementDirection): MovementDirection => {
  switch (direction) {
    case MovementDirection.up:
      return MovementDirection.down
    case MovementDirection.down:
      return MovementDirection.up
    case MovementDirection.left:
      return MovementDirection.right
    case MovementDirection.right:
      return MovementDirection.left
    default:
      return direction
  }
}

const input = `constructor() {
  this.visited = new Set()
  this.stack = []
}

nextMove = (playerPosition, playerVision) => {
  const { visited, stack } = this

  console.log("playerPosition", playerPosition)
  console.log("playerVision", playerVision)

  visited.add(\`\${playerPosition.row}-\${playerPosition.col}\`)

  if (playerVision.length === 0) {
    return "turnLeft"
  }

  if (playerVision[0] === "O") {
    return "turnLeft"
  }

  return "ahead"
}`

const templateSolution = `(class Runner {${input}
})`

function App() {
  const [state, setState] = useState<State>({
    map: generateMap(),
    playerPosition: generateRandomPosition(),
  })
  const { map, playerPosition } = state

  const nextState = (move: PossibleMoves) => {
    const newState = transition(state, move)
    setState(newState)
  }

  const winner = checkWin(state)
  const [value, setValue] = useState(input)
  const [error, setError] = useState("")

  const makeRunner = (script: string) => {
    try {
      setError("")
      return new (eval(script))()
    } catch (e: any) {
      console.log("setting error")
      setError(e.message)
      return null
    }
  }

  const onChange = (e: any) => {
    setValue(e.target.value)
  }

  const runner = useMemo(() => makeRunner(templateSolution), [])

  const runCycle = () => {
    if (winner) return

    if (runner !== null) {
      const move = runner.nextMove(state.playerPosition, playerVision(state))

      if (move) {
        nextState(move)
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <form>
          <textarea rows={20} cols={120} value={value} onChange={onChange} />
        </form>
        {winner && <h1>You won!</h1>}
        {error && <h3>{error}</h3>}
        <div className="grid">
          {map.map((row, rowIndex) => (
            <>
              <div key={rowIndex} className="grid-row">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`grid-cell ${
                      playerPosition.row === rowIndex && playerPosition.col === cellIndex
                        ? `player ${playerPosition.facing}`
                        : ""
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </>
          ))}
        </div>
        <button onClick={runCycle}>Move</button>
      </header>
    </div>
  )
}

export default App
